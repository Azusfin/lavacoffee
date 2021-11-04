import WebSocket from "ws"
import { Pool } from "undici"
import { Writable } from "stream"
import { CoffeeLava } from "./CoffeeLava"
import { TypedEmitter } from "tiny-typed-emitter"
import { NodeOptions, NodeStats } from "../utils/typings"
import { constructNode } from "../utils/decorators/constructs"
import { IncomingPayloads, EventPayloads, PlayerUpdatePayload, OutgoingPayloads } from "../utils/payloads"
import { OpCodes } from "../utils"
import { RequestOptions, ResponseData } from "undici/types/dispatcher"

export interface NodeEvents {
  /** Emitted when node is destroyed */
  destroy(): void
  /** Emitted when node connects */
  connect(): void
  /** Emitted when node reconnects */
  reconnect(): void
  /** Emitted when node disconnects */
  disconnect(reason: { code: number, reason: string }): void
  /** Emitted when node has an error */
  error(error: Error): void
  /** Emitted whenever any Lavalink incoming message is received */
  raw(payload: IncomingPayloads): void
  /** Emitted whenever any Lavalink event is received */
  event(payload: EventPayloads): void
  /** Emitted whenever playerUpdate is received */
  playerUpdate(guildID: string, state: PlayerUpdatePayload["state"]): void
}

@constructNode()
export class CoffeeNode extends TypedEmitter<NodeEvents> {
  /** The node options */
  public options: NodeOptions
  /** The node stats */
  public stats: NodeStats
  /** The node websocket if connected */
  public socket?: WebSocket
  /** Sums of http request calls since created */
  public calls = 0
  /** Whether the node already connected via websocket */
  public connected = false
  /** Whether the node is resumed from previous session */
  public resumed = false
  /** The http clients pool for http calls */
  public readonly http: Pool
  private reconnectTimeout?: NodeJS.Timeout
  private reconnectAttempts = 1

  public constructor(
    public readonly lava: CoffeeLava,
    options: NodeOptions
  ) {
    super()

    this.options = {
      password: "youshallnotpass",
      secure: false,
      retryAmount: 5,
      retryDelay: 30e3,
      maxConnections: null,
      ...options
    }

    this.stats = {
      players: 0,
      playingPlayers: 0,
      uptime: 0,
      memory: {
        free: 0,
        used: 0,
        allocated: 0,
        reservable: 0
      },
      cpu: {
        cores: 0,
        systemLoad: 0,
        lavalinkLoad: 0
      },
      lastUpdated: Date.now()
    }

    this.http = new Pool(`http${this.options.secure ? "s" : ""}://${this.options.url}`, {
      connections: this.options.maxConnections
    })

    this.lava.emit("nodeCreate", this)
    this.lava.nodes.set(this.options.name, this)
  }

  /**
   * Do http(s) request to the node
   */
  public async request<T>(endpoint: string): Promise<T> {
    endpoint = endpoint.replace(/^\//gm, "")

    const partials: string[] = []

    await this.http.stream({
      path: `/${endpoint}`,
      method: "GET",
      opaque: partials,
      bodyTimeout: this.options.requestTimeout,
      headersTimeout: this.options.requestTimeout,
      headers: {
        Authorization: this.options.password
      }
    }, ({ opaque }) => new Writable({
      defaultEncoding: "utf-8",
      write(partial: string, _, cb) {
        (opaque as string[]).push(partial)
        cb()
      }
    }))

    this.calls++
    return JSON.parse(partials.join(""))
  }

  /**
   * Do http(s) post request to the node
   */
  public async post(endpoint: string, body?: unknown, raw = false): Promise<ResponseData | unknown> {
    endpoint = endpoint.replace(/^\//gm, "")

    if (typeof body !== "undefined") body = JSON.stringify(body)

    const headers = {
      Authorization: this.options.password
    }

    const options: RequestOptions = {
      path: `/${endpoint}`,
      method: "POST",
      bodyTimeout: this.options.requestTimeout,
      headersTimeout: this.options.requestTimeout,
      headers
    }

    if (typeof body === "string") {
      headers["Content-Type"] = "application/json"
      options.body = body
    }

    const res = await this.http.request(options)

    this.calls++

    if (raw) return res
    return res.body.json()
  }

  /**
   * Connect to the node via socket
   */
  public connect(): void {
    if (this.connected) return

    const headers = {
      Authorization: this.options.password,
      "Num-Shards": String(this.lava.options.shards),
      "User-Id": this.lava.clientID,
      "Client-Name": this.lava.options.clientName
    }

    if (typeof this.lava.options.resumeConfig !== "undefined") {
      headers["Resume-Key"] = this.lava.options.resumeConfig.key
    }

    this.socket = new WebSocket(
      `ws${this.options.secure ? "s" : ""}://${this.options.url}/`,
      { headers }
    )

    this.socket.once("upgrade", req => {
      const resumed = req.headers["session-resumed"]

      if (resumed === "true") this.resumed = true
      else this.resumed = false
    })

    this.socket.once("open", this.open.bind(this))
    this.socket.once("close", this.close.bind(this))
    this.socket.on("error", this.error.bind(this))
    this.socket.on("message", this.message.bind(this))
  }

  /**
   * Destroy the node connection
   */
  public destroy(): void {
    if (!this.connected) return

    this.socket!.close(1000, "destroy")
    this.socket!.removeAllListeners()
    delete this.socket

    this.reconnectAttempts = 1
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)

    this.emit("destroy")
  }

  /**
   * Send data to the node
   */
  public send(data: OutgoingPayloads): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.connected) return resolve(false)

      const json = JSON.stringify(data)

      if (!data || !json.startsWith("{")) return resolve(false)

      this.socket?.send(json, err => {
        if (err) reject(err)
        else resolve(true)
      })
    })
  }

  /** Configure the resume config */
  public configResume(): void {
    if (!this.lava.options.resumeConfig) return

    void this.send({
      op: OpCodes.ConfigResume,
      key: this.lava.options.resumeConfig.key,
      timeout: this.lava.options.resumeConfig.timeout!
    })
  }

  private reconnect(): void {
    this.reconnectTimeout = setTimeout(() => {
      if (this.reconnectAttempts >= this.options.retryAmount!) {
        this.error(new Error(`Unable to reconnect after ${this.options.retryAmount!} attempts`))
        return this.destroy()
      }

      this.socket?.removeAllListeners()
      delete this.socket

      this.emit("reconnect")
      this.connect()

      this.reconnectAttempts++
    }, this.options.retryDelay)
  }

  private open(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
    this.connected = true
    this.configResume()
    this.emit("connect")
  }

  private close(code: number, reason: string): void {
    this.connected = false
    this.emit("disconnect", { code, reason })
    if (code !== 1000 || reason !== "destroy") this.reconnect()
  }

  private error(error: Error): void {
    this.emit("error", error)
  }

  private message(d: Buffer | string): void {
    if (Array.isArray(d)) d = Buffer.concat(d)
    else if (d instanceof ArrayBuffer) d = Buffer.from(d)

    const payload: IncomingPayloads = JSON.parse(d.toString())

    if (!payload.op) return
    this.emit("raw", payload)

    switch (payload.op) {
      case "stats":
        this.stats = {
          players: payload.players,
          playingPlayers: payload.playingPlayers,
          uptime: payload.uptime,
          memory: payload.memory,
          cpu: payload.cpu,
          lastUpdated: Date.now(),
          frameStats: payload.frameStats
        }
        break
      case "playerUpdate":
        this.emit("playerUpdate", payload.guildId, payload.state)
        break
      case "event":
        this.emit("event", payload)
        break
      default:
        this.error(new Error(`Unexpected op '${payload.op}' with data: ${d.toString()}`))
    }
  }
}

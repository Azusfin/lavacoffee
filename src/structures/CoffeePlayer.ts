/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import { CoffeeNode } from "./CoffeeNode"
import { CoffeeLava } from "./CoffeeLava"
import { Filters } from "../utils/filters"
import { CoffeeQueue } from "./CoffeeQueue"
import { PlayerOptions, PlayOptions } from "../utils/typings"
import { check } from "../utils/decorators/validators"
import { constructPlayer } from "../utils/decorators/constructs"
import { VoiceUpdatePayload, PausePayload, SeekPayload, StopPayload, VolumePayload, FiltersPayload, PlayPayload } from "../utils/payloads"
import { LoopMode, PlayerStates, PlayerVoiceStates, OpCodes } from "../utils/constants"
import { CoffeeTrack, UnresolvedTrack } from "./CoffeeTrack"
import { LoadTypes } from "../utils/rest"
import { FilterUtils } from "../utils/filterUtils"

@constructPlayer()
export class CoffeePlayer {
  /** The queue for the player */
  public readonly queue: CoffeeQueue
  /** The player options */
  public readonly options: PlayerOptions
  /** The player manager */
  public readonly lava: CoffeeLava
  /** The player position in milliseconds */
  public position = 0
  /** Whether the player is currently replaying */
  public replaying = false
  /** Whether the player is connected to voice on node-side */
  public voiceConnected = false
  /** The player filters */
  public filters: Filters = {}
  /** The player loop mode */
  public loop: LoopMode = LoopMode.None
  /** The player state */
  public state: PlayerStates = PlayerStates.Paused
  /** The player voice state */
  public voiceState: PlayerVoiceStates = PlayerVoiceStates.Disconnected
  /** The player voice payload */
  public voice: VoiceUpdatePayload = Object.create(null)
  /** The player play options if its currently playing */
  public playOptions?: PlayOptions

  public constructor(lava: CoffeeLava, options: PlayerOptions) {
    this.lava = lava

    this.queue = new lava.options.structures!.Queue!()
    this.options = {
      volume: 100,
      selfMute: false,
      selfDeaf: true,
      node: this.lava.leastLoadNode?.options.name,
      ...options
    }

    this.lava.players.set(this.options.guildID, this)
    this.lava.emit("playerCreate", this)
    this.setVolume()
  }

  /** The node used by player */
  public get node(): CoffeeNode {
    const node = this.lava.nodes.get(this.options.node!)
    if (!node || !node.connected) throw new Error("No node is available currently")
    return node
  }

  /** Move the player to another node */
  @check(function (this: CoffeePlayer, method, node: string) {
    if (this.options.node === node) return
    return method(node)
  })
  public setNode(node: string): void {
    try {
      void this.node.send({
        op: OpCodes.Destroy,
        guildId: this.options.guildID
      })
    // eslint-disable-next-line no-empty
    } catch {}

    this.options.node = node

    if (
      ["op", "guildId", "event", "sessionId"].every(prop => prop in this.voice)
    ) void this.node.send(this.voice)

    if (this.queue.current) {
      void this.resolveCurrent().then(() => {
        const payload: PlayPayload = {
          op: OpCodes.Play,
          ...this.playOptions,
          guildId: this.options.guildID,
          track: (this.queue.current as CoffeeTrack).base64,
          startTime: this.position
        }
        this.lava.emit("playerReplay", this)
        void this.node.send(payload)
        this.replaying = true
      })
    }
  }

  /** Connect to the voice channel */
  @check(function (this: CoffeePlayer, method) {
    if (!this.options.voiceID) throw new Error("No voice channel has been set")
    return method()
  })
  public connect(): void {
    this.voiceState = PlayerVoiceStates.Connecting
    this.lava.options.send(this.options.guildID, {
      op: 4,
      d: {
        guild_id: this.options.guildID,
        channel_id: this.options.voiceID!,
        self_mute: this.options.selfMute!,
        self_deaf: this.options.selfDeaf!
      }
    })
    this.voiceState = PlayerVoiceStates.Connected
  }

  /** Disconnect from the voice channel */
  @check(function (this: CoffeePlayer, method) {
    if (this.voiceState !== PlayerVoiceStates.Connected) return
    return method()
  })
  public disconnect(): void {
    this.voiceState = PlayerVoiceStates.Disconnecting
    this.pause(true)
    this.lava.options.send(this.options.guildID, {
      op: 4,
      d: {
        guild_id: this.options.guildID,
        channel_id: null,
        self_mute: false,
        self_deaf: false
      }
    })
    this.voiceState = PlayerVoiceStates.Disconnected
  }

  /** Play the next track in queue */
  @check(function (this: CoffeePlayer, method, options: PlayOptions) {
    if (
      typeof options !== "object" || options === null
    ) throw new TypeError("Parameter 'options' must be present and be an object")
    return method(options)
  })
  public async play(options: PlayOptions): Promise<void> {
    const prevOfPrevious = this.queue.previous

    if (
      this.loop === LoopMode.Track ||
      (this.loop === LoopMode.Queue && !this.queue.length)
    ) {
      this.queue.previous = this.queue.current
    } else {
      this.queue.progress()
      if (this.loop === LoopMode.Queue) this.queue.add(this.queue.previous!)
    }

    if (!this.queue.current) return

    try {
      await this.resolveCurrent()
    } catch (error) {
      this.lava.emit("trackError", this, this.queue.current, error)
      this.queue.current = this.queue.previous
      this.queue.previous = prevOfPrevious
      if (this.queue.length) await this.play(options)
      return
    }

    const payload: PlayPayload = {
      op: OpCodes.Play,
      guildId: this.options.guildID,
      track: (this.queue.current as CoffeeTrack).base64,
      startTime: options.startTime,
      endTime: options.endTime
    }

    await this.node.send(payload)
  }

  /** Patch the player filters */
  @check(function (this: CoffeePlayer, method) {
    if (!this.queue.current) return
    return method()
  })
  public patchFilters(): void {
    const payload: FiltersPayload = {
      op: OpCodes.Filters,
      guildId: this.options.guildID,
      ...this.filters
    }
    void this.node.send(payload)
  }

  /** Set the player filters */
  @check(function (this: CoffeePlayer, method, filters: Filters) {
    if (
      typeof filters !== "object" || filters === null
    ) throw new TypeError("Parameter 'filters' must be present and be an object")
    return method(filters)
  })
  public setFilters(filters: Filters | FilterUtils): void {
    this.filters = filters instanceof FilterUtils ? filters.build() : filters
  }

  /** Set the player volume */
  @check(function (this: CoffeePlayer, method, volume?: number) {
    volume = Number(volume)
    if (isNaN(volume)) volume = this.options.volume
    return method(volume)
  })
  public setVolume(volume?: number): void {
    this.options.volume = Math.max(Math.min(volume!, 1000), 0)
    const payload: VolumePayload = {
      op: OpCodes.Volume,
      guildId: this.options.guildID,
      volume: this.options.volume
    }
    void this.node.send(payload)
  }

  /** Set the player loop mode */
  @check(function (this: CoffeePlayer, method, loopMode: LoopMode) {
    if (loopMode < LoopMode.None || loopMode > LoopMode.Queue) loopMode = LoopMode.None
    return method(loopMode)
  })
  public setLoop(loopMode: LoopMode): void {
    this.loop = loopMode
  }

  /** Stops the current track, optionally give an amount to skip to, e.g 5 would play the 5th song */
  @check(function (this: CoffeePlayer, method, amount?: number) {
    if (typeof amount === "number" && amount > 1) {
      if (amount > this.queue.length) throw new RangeError("Cannot skip more than the queue length.")
    }
    return method(amount)
  })
  public stop(amount?: number): void {
    if (typeof amount === "number" && amount > 1) this.queue.splice(0, amount - 1)
    const payload: StopPayload = {
      op: OpCodes.Stop,
      guildId: this.options.guildID
    }
    void this.node.send(payload)
  }

  /** Pause the current track */
  @check(function (this: CoffeePlayer, method, pause: boolean) {
    if (typeof pause !== "boolean") throw new TypeError("Parameter 'pause' must be present and be a boolean")
    if ((pause && this.state === PlayerStates.Paused) || !this.queue.totalSize) return
    return method(pause)
  })
  public pause(pause: boolean): void {
    this.state = pause ? PlayerStates.Paused : PlayerStates.Playing
    const payload: PausePayload = {
      op: OpCodes.Pause,
      guildId: this.options.guildID,
      pause
    }
    void this.node.send(payload)
  }

  /** Seek to the position in current track */
  @check(function (this: CoffeePlayer, method, position: number) {
    if (!this.queue.current) return
    position = Number(position)
    if (isNaN(position)) throw new TypeError("Parameter 'position' must be present and be a number")
    if (position < 0 || position > this.queue.current.duration!) {
      position = Math.max(Math.min(position, this.queue.current.duration!), 0)
    }
    return method(position)
  })
  public seek(position: number): void {
    this.position = position
    const payload: SeekPayload = {
      op: OpCodes.Seek,
      guildId: this.options.guildID,
      position
    }
    void this.node.send(payload)
  }

  /** Destroy the player */
  public destroy(): void {
    this.state = PlayerStates.Destroyed
    this.disconnect()

    void this.node.send({
      op: OpCodes.Destroy,
      guildId: this.options.guildID
    })

    this.lava.players.delete(this.options.guildID)
    this.lava.emit("playerDestroy", this)
  }

  /** Set a property into metadata */
  public set(key: string, value: unknown): void {
    if (this.options.metadata) this.options.metadata[key] = value
  }

  /** Get a property from metadata */
  public get<T>(key: string): T | undefined {
    return this.options.metadata?.[key] as T
  }

  private async resolveCurrent(): Promise<void> {
    const track = this.queue.current!
    if (UnresolvedTrack.isUnresolved(track)) {
      const query = [track.author, track.title].filter(str => str).join(" - ")
      const res = await this.lava.search({ query }, track.requester)

      if (res.loadType !== LoadTypes.SearchResult) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw res.error ?? {
          message: "No tracks found.",
          severity: "COMMON"
        }
      }

      if (track.author) {
        const channelNames = [track.author, `${track.author} - Topic`]
        const originalAudio = res.tracks.find(
          cTrack => channelNames.some(
            name => name === cTrack.author || name === cTrack.title
          )
        )

        if (originalAudio) {
          this.queue.current = originalAudio
          return
        }
      }

      if (track.duration) {
        const sameDuration = res.tracks.find(
          cTrack => (cTrack.duration >= (track.duration! - 1500)) &&
            (cTrack.duration <= (track.duration! + 1500))
        )

        if (sameDuration) {
          this.queue.current = sameDuration
          return
        }
      }

      this.queue.current = res.tracks[0]
    }
  }
}

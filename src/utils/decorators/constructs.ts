import { NodeOptions, PlayerOptions, LavaOptions } from "../typings"
import { CoffeeLava } from "../../structures/CoffeeLava"
import { TrackData } from "../rest"

export function decorateConstructor(func: (target, args: any[]) => any) {
  return function decorate(target) {
    return new Proxy(target, {
      construct(constructor, args) {
        return func(constructor, args)
      }
    })
  }
}

export function constructCoffee(): (target: any) => any {
  return decorateConstructor((coffee, args) => {
    const options = args[0] as LavaOptions

    if (!options) throw new TypeError("LavaOptions must not be empty")
    if (typeof options.send !== "function") throw new TypeError("Lava option 'send' must be present and be a function")

    if (
      typeof options.clientName !== "undefined" &&
      (typeof options.clientName !== "string" || !options.clientName)
    ) throw new TypeError("Lava option 'clientName' must be a non-empty string")

    if (
      typeof options.shards !== "undefined" &&
      (typeof options.shards !== "number" || isNaN(options.shards))
    ) throw new TypeError("Lava option 'shards' must be a number")

    if (
      typeof options.autoPlay !== "undefined" &&
      typeof options.autoPlay !== "boolean"
    ) throw new TypeError("Lava option 'autoPlay' must be a boolean")

    if (
      typeof options.defaultSearchPlatform !== "undefined" &&
      (typeof options.defaultSearchPlatform !== "string" || !options.defaultSearchPlatform)
    ) throw new TypeError("Lava option 'defaultSearchPlatform' must be a non-empty string")

    if (
      typeof options.autoReplay !== "undefined" &&
      typeof options.autoReplay !== "boolean"
    ) throw new TypeError("Lava option 'autoReplay' must be a boolean")

    return new coffee(options)
  })
}

export function constructPlayer(): (target: any) => any {
  return decorateConstructor((player, args) => {
    const lava = args[0] as CoffeeLava
    const options = args[1] as PlayerOptions

    if (!(lava instanceof CoffeeLava)) throw new TypeError("Lava must be instanceof CoffeeLava")
    if (!options) throw new TypeError("PlayerOptions must not be empty")

    if (
      typeof options.guildID !== "string" || !options.guildID
    ) throw new TypeError("Player option 'guildID' must be present and be a non-empty string")

    if (lava.players.has(options.guildID)) return lava.players.get(options.guildID)

    if (
      typeof options.voiceID !== "undefined" &&
      (typeof options.voiceID !== "string" || !options.voiceID)
    ) throw new TypeError("Player option 'voiceID' must be a non-empty string")

    if (
      typeof options.node !== "undefined" &&
      (typeof options.node !== "string" || !options.node)
    ) throw new TypeError("Player option 'node' must be a non-empty string")

    if (
      typeof options.volume !== "undefined" &&
      (typeof options.volume !== "number" || isNaN(options.volume))
    ) throw new TypeError("Player option 'volume' must be a number")

    if (
      typeof options.selfMute !== "undefined" &&
      typeof options.selfMute !== "boolean"
    ) throw new TypeError("Player option 'selfMute' must be a boolean")

    if (
      typeof options.selfDeaf !== "undefined" &&
      typeof options.selfDeaf !== "boolean"
    ) throw new TypeError("Player option 'selfDeaf' must be a boolean")

    if (
      typeof options.metadata !== "undefined" &&
      (typeof options.metadata !== "object" || options.metadata === null)
    ) throw new TypeError("Player option 'metadata' must be an object")

    return new player(lava, options)
  })
}

export function constructNode(): (target: any) => any {
  return decorateConstructor((node, args) => {
    const lava = args[0] as CoffeeLava
    const options = args[1] as NodeOptions

    if (!(lava instanceof CoffeeLava)) throw new TypeError("Lava must be instanceof CoffeeLava")
    if (!options) throw new TypeError("NodeOptions must not be empty")

    if (
      typeof options.name !== "string" || !options.name
    ) throw new TypeError("Node option 'name' must be present and be a non-empty string")

    if (lava.nodes.has(options.name)) return lava.nodes.get(options.name)!

    if (
      typeof options.url !== "string" || !options.url
    ) throw new TypeError("Node option 'url' must be present and be a non-empty string")

    if (
      typeof options.password !== "undefined" &&
      (typeof options.password !== "string" || !options.password)
    ) throw new TypeError("Node option 'password' must be a non-empty string")

    if (
      typeof options.secure !== "undefined" &&
      typeof options.secure !== "boolean"
    ) throw new TypeError("Node option 'secure' must be a boolean")

    if (
      typeof options.retryAmount !== "undefined" &&
      typeof options.retryAmount !== "number"
    ) throw new TypeError("Node option 'retryAmount' must be a number")

    if (
      typeof options.retryDelay !== "undefined" &&
      typeof options.retryDelay !== "number"
    ) throw new TypeError("Node option 'retryDelay' must be a number")

    if (
      typeof options.requestTimeout !== "undefined" &&
      typeof options.requestTimeout !== "number"
    ) throw new TypeError("Node option 'requestTimeout' must be a number.")

    if (
      options.maxConnections === null
        ? false
        : (typeof options.maxConnections !== "undefined" &&
          (typeof options.maxConnections !== "number" ||
            isNaN(options.maxConnections) || options.maxConnections < 1
          )
        )
    ) throw new TypeError("Node option 'maxConnections' must be null or more-than-zero number")

    return new node(lava, options)
  })
}

export function constructTrack(): (target: any) => any {
  return decorateConstructor((trackClass, args) => {
    const track: TrackData = args[0]
    const requester = args[1]

    if (!track) throw new TypeError("TrackData must not be empty")

    if (
      typeof track.track !== "string" || !track.track
    ) throw new TypeError("TrackData property 'track' must be present and be a non-empty string")

    if (!track.info) throw new TypeError("TrackData#info must not be empty")

    if (
      typeof track.info.identifier !== "string" || !track.info.identifier
    ) throw new TypeError("TrackData#info property 'identifier' must be present and be a non-empty string")

    if (typeof track.info.isSeekable !== "boolean") throw new TypeError("TrackData#info property 'isSeekable' must be present and be a boolean")

    if (
      typeof track.info.author !== "string" || !track.info.author
    ) throw new TypeError("TrackData#info property 'author' must be present and be a non-empty string")

    if (typeof track.info.length !== "number") throw new TypeError("TrackData#info property 'length' must be present and be a number")
    if (typeof track.info.isStream !== "boolean") throw new TypeError("TrackData#info property 'isStream' must be present and be a boolean")

    if (
      typeof track.info.title !== "string" || !track.info.title
    ) throw new TypeError("TrackData#info property 'title' must be present and be a non-empty string")

    if (
      typeof track.info.uri !== "string" || !track.info.uri
    ) throw new TypeError("TrackData#info property 'uri' must be present and be a non-empty string")

    if (
      typeof track.info.sourceName !== "string" || !track.info.sourceName
    ) throw new TypeError("TrackData#info property 'sourceName' must be present and be a non-empty string")

    return new trackClass(track, requester)
  })
}

export function constructUnresolved(): (target: any) => any {
  return decorateConstructor((unresolvedClass, args) => {
    const title: string = args[0]
    const author: string = args[1]
    const duration: number = args[2]
    const requester = args[3]

    if (
      typeof title !== "string" || !title
    ) throw new TypeError("Parameter 'title' must be present and be a non-empty string")

    if (
      typeof author !== "undefined" &&
      (typeof author !== "string" || !author)
    ) throw new TypeError("Parameter 'author' must be a non-empty string")

    if (
      typeof duration !== "undefined" &&
      typeof duration !== "number"
    ) throw new TypeError("Parameter 'duration' must be a number")

    return new unresolvedClass(title, author, duration, requester)
  })
}

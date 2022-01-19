import { CoffeeLava, CoffeeNode, CoffeePlayer, CoffeeQueue } from "../structures";
import { CoffeeTrack } from "../structures/CoffeeTrack";
import { LoadTypes } from "./rest";

export interface NodeOptions {
  /** The url for the node */
  url: string
  /** The name for the node. */
  name: string
  /** The password for the node */
  password?: string
  /** Whether the host uses SSL. */
  secure?: boolean
  /** The retryAmount for the node. */
  retryAmount?: number
  /** The retryDelay for the node. */
  retryDelay?: number
  /** The timeout used for api calls */
  requestTimeout?: number
  /** The max http connections that can be opened at once, null for unlimited */
  maxConnections?: number | null
}

export interface NodeMemoryStats {
  /** The free memory of the allocated amount. */
  free: number
  /** The used memory of the allocated amount. */
  used: number
  /** The total allocated memory. */
  allocated: number
  /** The reservable memory. */
  reservable: number
}

export interface NodeCPUStats {
  /** The core amount the host machine has. */
  cores: number
  /** The system load. */
  systemLoad: number
  /** The lavalink load. */
  lavalinkLoad: number
}

export interface NodeFrameStats {
  /** The amount of sent frames. */
  sent: number
  /** The amount of nulled frames. */
  nulled: number
  /** The amount of deficit frames. */
  deficit: number
}

export interface NodeStats {
  /** The amount of players on the node. */
  players: number
  /** The amount of playing players on the node. */
  playingPlayers: number
  /** The uptime for the node. */
  uptime: number
  /** The memory stats for the node. */
  memory: NodeMemoryStats
  /** The cpu stats for the node. */
  cpu: NodeCPUStats
  /** Timestamp of the time the stats was updated */
  lastUpdated: number
  /** The frame stats for the node. */
  frameStats?: NodeFrameStats
}

export type SearchPlatform = "yt" | "ytm" | "sc"

export interface VoiceStatePayload {
  op: number
  d: {
    guild_id: string
    channel_id: string | null
    self_mute: boolean
    self_deaf: boolean
  }
}

export interface LavaOptions<T = unknown> {
  /** The value to use for 'Client-Name' header */
  clientName?: string
  /** The shards count */
  shards?: number
  /** Whether players should automatically play next song */
  autoPlay?: boolean
  /** The default search platform to use, can be "yt" for youtube, "ytm" for youtube music, and "sc" for soundcloud */
  defaultSearchPlatform?: SearchPlatform
  /** Whether to replay track automatically when node used on player is disconnected */
  autoReplay?: boolean
  /** Wether to resume voice connection if socket closed unexpectedly */
  autoResume?: boolean
  /** The config for resuming */
  resumeConfig?: ResumeConfig<T>
  /** The used structures for the instance */
  structures?: Structures<T>
  /** Whether to use system load or lavalink load for load balancing, default to system */
  balanceLoad?: "system" | "lavalink"
  /** Required plugins for the nodes, a node won't be used if it doesn't have the required plugins */
  requiredPlugins?: string[]
  /** Function to send voice state to the websocket */
  send(guildID: string, voiceState: VoiceStatePayload)
}

export interface SearchQuery {
  /** The query to search for */
  query: string
  /** Whether to allow using search */
  allowSearch?: boolean
  /** The source to search from */
  source?: SearchPlatform
  /** Required plugins for the node used to query */
  requiredPlugins?: string[]
}

export interface PlayerOptions {
  /** The guild the Player belongs to */
  guildID: string
  /** The voice channel the Player belongs to */
  voiceID?: string
  /** The node the Player use */
  node?: string
  /** The initial volume the Player will use */
  volume?: number
  /** If the player should mute itself */
  selfMute?: boolean
  /** If the player should deaf itself */
  selfDeaf?: boolean
  /** Additional metadata for player, if any */
  metadata?: Record<string, unknown>
  /** Required plugins for the node used to play */
  requiredPlugins?: string[]
}

export interface PlayOptions {
  /** The position to start the track */
  startTime?: number
  /** The position to end the track */
  endTime?: number
}

export interface Playlist<T = unknown> {
  /** The playlist name */
  name: string
  /** The selected track, if any */
  selectedTrack: CoffeeTrack<T> | null
  /** Playlist total duration */
  duration: number
}

export interface SearchResult<T = unknown> {
  /** Load type from searching */
  loadType: LoadTypes
  /** The tracks from searching */
  tracks: CoffeeTrack<T>[]
  /** The playlist info if load type is playlist */
  playlist?: Playlist
  /** Error from searching, if failed */
  error?: {
    message: string
    severity: string
  }
}

export interface ResumeConfig<T = unknown> {
  /** The resume key for resuming lavalink session */
  key: string
  /** The timeout for the session, if timeout is passed before resumed, it can't be resumed anymore */
  timeout?: number
  /** The function to create and handle player after resuming */
  handle(lava: CoffeeLava<T>, guildID: string, callback: (player: CoffeePlayer<T>) => void): any
}

export interface Structures<T = unknown> {
  Node?: new (lava: CoffeeLava<T>, options: NodeOptions) => CoffeeNode
  Player?: new (lava: CoffeeLava<T>, options: PlayerOptions) => CoffeePlayer<T>
  Queue?: new () => CoffeeQueue<T>
}

export interface PluginRaw {
  name: string
  version: string
}

export type PluginsRaw = PluginRaw[]

/** K = pluginName, V = pluginVersion */
export type Plugins = Map<string, string>

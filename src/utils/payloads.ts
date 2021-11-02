import { Filters } from "./filters"
import { NodeStats } from "./typings"
import { OpCodes, OpIncoming, EventTypes } from "./constants"

export interface VoiceServerUpdate {
  op: 0
  s: number
  t: "VOICE_SERVER_UPDATE"
  d: {
    token: string
    guild_id: string
    endpoint: string
  }
}

export interface VoiceStateUpdate {
  op: 0
  s: number
  t: "VOICE_STATE_UPDATE"
  d: {
    guild_id: string
    channel_id?: string
    user_id: string
    session_id: string
    deaf: boolean
    mute: boolean
    self_deaf: boolean
    self_mute: boolean
    self_stream?: boolean
    self_video: boolean
    suppress: boolean
    request_to_speak_timestamp?: number
  }
}

export interface OutgoingPayload {
  op: OpCodes
  guildId: string
}

export type OutgoingPayloads =
  | VoiceUpdatePayload
  | PlayPayload
  | StopPayload
  | PausePayload
  | SeekPayload
  | VolumePayload
  | FiltersPayload
  | DestroyPayload
  | ConfigResumePayload

export interface VoiceUpdatePayload extends OutgoingPayload {
  op: OpCodes.VoiceUpdate
  event: VoiceServerUpdate["d"]
  sessionId: string
}

export interface PlayPayload extends OutgoingPayload {
  op: OpCodes.Play
  track: string
  startTime?: number
  endTime?: number
  volume?: number
  noReplace?: boolean
  pause?: boolean
}

export interface StopPayload extends OutgoingPayload {
  op: OpCodes.Stop
}

export interface PausePayload extends OutgoingPayload {
  op: OpCodes.Pause
  pause: boolean
}

export interface SeekPayload extends OutgoingPayload {
  op: OpCodes.Seek
  position: number
}

export interface VolumePayload extends OutgoingPayload {
  op: OpCodes.Volume
  volume: number
}

export interface FiltersPayload extends OutgoingPayload, Filters {
  op: OpCodes.Filters
}

export interface DestroyPayload extends OutgoingPayload {
  op: OpCodes.Destroy
}

export interface ConfigResumePayload {
  op: OpCodes.ConfigResume
  key: string
  timeout: number
}

export interface IncomingPayload {
  op: OpIncoming
}

export type IncomingPayloads =
  | PlayerUpdatePayload
  | StatsPayload
  | EventPayloads

export interface PlayerUpdatePayload extends IncomingPayload {
  op: OpIncoming.PlayerUpdate
  guildId: string
  state: {
    time: number
    position: number
    connected: boolean
  }
}

export interface StatsPayload extends IncomingPayload, NodeStats {
  op: OpIncoming.Stats
}

export interface EventPayload extends IncomingPayload {
  op: OpIncoming.Event
  type: EventTypes
  guildId: string
}

export type EventPayloads =
  | TrackStartPayload
  | TrackEndPayload
  | TrackExceptionPayload
  | TrackStuckPayload
  | WebSocketClosedPayload

export interface TrackStartPayload extends EventPayload {
  type: EventTypes.TrackStart
  track: string
}

export interface TrackEndPayload extends EventPayload {
  type: EventTypes.TrackEnd
  track: string
  reason: string
}

export interface TrackExceptionPayload extends EventPayload {
  type: EventTypes.TrackException
  track: string
  exception: {
    message: string
    severity: string
    cause: string
  }
}

export interface TrackStuckPayload extends EventPayload {
  type: EventTypes.TrackStuck
  track: string
  thresholdMs: number
}

export interface WebSocketClosedPayload extends EventPayload {
  type: EventTypes.WebSocketClosed
  code: number
  reason: string
  byRemote: boolean
}

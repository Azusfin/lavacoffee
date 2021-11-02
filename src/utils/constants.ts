export enum OpCodes {
  VoiceUpdate = "voiceUpdate",
  Play = "play",
  Stop = "stop",
  Pause = "pause",
  Seek = "seek",
  Volume = "volume",
  Filters = "filters",
  Destroy = "destroy",
  ConfigResume = "configureResuming"
}

export enum OpIncoming {
  PlayerUpdate = "playerUpdate",
  Stats = "stats",
  Event = "event"
}

export enum EventTypes {
  TrackStart = "TrackStartEvent",
  TrackEnd = "TrackEndEvent",
  TrackException = "TrackExceptionEvent",
  TrackStuck = "TrackStuckEvent",
  WebSocketClosed = "WebSocketClosedEvent"
}

export enum LoopMode {
  None,
  Track,
  Queue
}

export enum PlayerStates {
  Playing,
  Paused,
  Destroyed
}

export enum PlayerVoiceStates {
  Connecting,
  Connected,
  Disconnecting,
  Disconnected
}

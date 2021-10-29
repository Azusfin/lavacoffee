export enum LoadTypes {
  TrackLoaded = "TRACK_LOADED",
  PlaylistLoaded = "PLAYLIST_LOADED",
  SearchResult = "SEARCH_RESULT",
  NoMatches = "NO_MATCHES",
  LoadFailed = "LOAD_FAILED"
}

export interface TrackInfo {
  identifier: string
  isSeekable: boolean
  author: string
  length: number
  isStream: boolean
  title: string
  uri: string
  sourceName: string
}

export interface TrackData {
  track: string
  info: TrackInfo
}

export type Tracks = TrackData[]

export interface TracksData {
  loadType: LoadTypes
  tracks: Tracks
  playlistInfo?: {
    name: string
    selectedTrack: number
  }
  exception?: {
    message: string
    severity: string
  }
}

import { IpBlock, RoutePlanner } from "./constants";

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

export interface RoutePlannerStatus {
  class: RoutePlanner,
  details: RoutePlannerDetails
}

export interface RoutePlannerDetails {
  ipBlock: {
    type: IpBlock,
    size: string
  },
  failingAddresses: {
    address: string,
    failingTimestamp: number,
    failingTime: string
  }[]
}

/** [RoutePlanner](https://github.com/freyacodes/Lavalink/blob/master/ROUTEPLANNERS.md) */
export type RoutePlanners =
  | BalancingRoutePlanner
  | RotatingRoutePlanner
  | NanoRoutePlanner
  | RotatingNanoRoutePlanner

export interface BalancingRoutePlanner extends RoutePlannerStatus {
  class: RoutePlanner.Balancing
}

export interface RotatingRoutePlanner extends RoutePlannerStatus {
  class: RoutePlanner.Rotating
  details: RotatingRoutePlannerDetails
}

export interface RotatingRoutePlannerDetails extends RoutePlannerDetails {
  rotateIndex: string
  ipIndex: string
  currentAddress: string
}

export interface NanoRoutePlanner extends RoutePlannerStatus {
  class: RoutePlanner.Nano
  details: NanoRoutePlannerDetails
}

export interface NanoRoutePlannerDetails extends RoutePlannerDetails {
  currentAddressIndex: string
}

export interface RotatingNanoRoutePlanner extends RoutePlannerStatus {
  class: RoutePlanner.RotatingNano
  details: RotatingNanoRoutePlannerDetails
}

export interface RotatingNanoRoutePlannerDetails extends RoutePlannerDetails {
  blockIndex: string
  currentAddressIndex: string
}

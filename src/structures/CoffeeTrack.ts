import { TrackData, TrackInfo } from "../utils/rest"
import { constructTrack, constructUnresolved } from "../utils/decorators/constructs"

export interface ITrack {
  /** The title of the track */
  title: string
  /** The identifier of the track */
  identifier: string
  /** The author of the track */
  author: string
  /** The duration of the track */
  duration: number
  /** Whether the track is seekable */
  isSeekable: boolean
  /** Whether the track is a stream */
  isStream: boolean
  /** The url of the track */
  url: string
  /** The source of the track */
  source: string
}

@constructTrack()
export class CoffeeTrack implements ITrack {
  /** The base 64 encoded of track */
  public readonly base64: string
  /** The requester of the track if any */
  public readonly requester?: unknown
  public title: string
  public identifier: string
  public author: string
  public duration: number
  public isSeekable: boolean
  public isStream: boolean
  public url: string
  public source: string

  public constructor(track: TrackData, requester?: unknown) {
    this.base64 = track.track
    this.requester = requester
    this.build(track.info)
  }

  /** Check if obj is a valid Track */
  public static isTrack(obj: unknown): obj is CoffeeTrack {
    return typeof obj === "object" && obj ? obj instanceof CoffeeTrack : false
  }

  /** Display thumbnail url if source is youtube */
  public displayThumbnail(size = "default"): string | undefined {
    if (this.source !== "youtube") return

    return `https://img.youtube.com/vi/${this.identifier}/${size}.jpg`
  }

  /** Build TrackInfo into ITrack */
  public build(info: TrackInfo): void {
    this.title = info.title
    this.identifier = info.identifier
    this.author = info.author
    this.duration = info.length
    this.isSeekable = info.isSeekable
    this.isStream = info.isStream
    this.url = info.uri
    this.source = info.sourceName
  }
}

@constructUnresolved()
export class UnresolvedTrack {
  public constructor(
    /** Supposely the title of the track */
    public readonly title: string,
    /** Supposably the author of the track */
    public readonly author?: string,
    /** Supposably the duration of the track */
    public readonly duration?: number,
    /** The requester of the track if any */
    public readonly requester?: unknown
  ) {}

  public static isUnresolved(obj: unknown): obj is UnresolvedTrack {
    return typeof obj === "object" && obj ? obj instanceof UnresolvedTrack : false
  }
}

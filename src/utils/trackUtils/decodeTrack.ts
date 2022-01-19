import { DataInput } from "./dataInput"
import { TrackInfo } from "../rest"

/** Decode base64 string, buffer, or data input track to track info */
export function decodeTrack<T = Record<string, unknown>>(
  track: string | Buffer | DataInput,
  decodeTrackDetails?: (source: string, data: DataInput) => T
): TrackInfo & T {
  if (typeof track === "string") {
    track = Buffer.from(track, "base64")
  }

  const data = track instanceof Buffer ? new DataInput(track) : track

  data.read()

  const title = data.readUTF()
  const author = data.readUTF()
  const length = data.readLong()
  const identifier = data.readUTF()
  const isStream = data.readBool()
  const uri = data.readNullableText()!
  const sourceName = data.readUTF()

  const trackInfo: TrackInfo = {
    title,
    author,
    length,
    identifier,
    isStream,
    uri,
    sourceName,
    isSeekable: !isStream
  }

  if (typeof decodeTrackDetails === "function") {
    const trackDetails = decodeTrackDetails(sourceName, data)
    Object.assign(trackInfo, trackDetails)
  }

  return trackInfo as TrackInfo & T
}

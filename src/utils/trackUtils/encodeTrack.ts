import { DataOutput } from "./dataOutput";
import { TrackInfo } from "../rest"

const TrackInfoVersioned = 1
const TrackInfoVersion = 2

/** Encode track info into buffer */
export function encodeTrack<T = Record<string, unknown>>(
  trackInfo: TrackInfo & T,
  encodeTrackDetails?: (trackInfo: TrackInfo & T, data: DataOutput) => unknown,
  writePosition = true
): Buffer {
  const data = new DataOutput()

  data.write(TrackInfoVersion)
  data.writeUTF(trackInfo.title)
  data.writeUTF(trackInfo.author)
  data.writeLong(trackInfo.length)
  data.writeUTF(trackInfo.identifier)
  data.writeBool(trackInfo.isStream)
  data.writeNullableText(trackInfo.uri)
  data.writeUTF(trackInfo.sourceName)

  if (typeof encodeTrackDetails === "function") {
    encodeTrackDetails(trackInfo, data)
  }

  if (writePosition) data.writeLong(0)

  return data.commit(TrackInfoVersioned)
}

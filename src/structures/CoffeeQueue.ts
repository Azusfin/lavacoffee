import { CoffeeTrack, UnresolvedTrack } from "./CoffeeTrack"
import { Queue } from "../utils/decorators/validators"

/** The player's queue, the `current` property is the currently playing track, think of the rest as the up-coming tracks */
export class CoffeeQueue<T = unknown> extends Array<CoffeeTrack<T> | UnresolvedTrack<T>> {
  /** The current track */
  public current?: CoffeeTrack<T> | UnresolvedTrack<T>
  /** The previous track */
  public previous?: CoffeeTrack<T> | UnresolvedTrack<T>

  /** The total duration of the queue */
  public get duration(): number {
    const current = this.current?.duration ?? 0
    return this.reduce((acc, tr) => acc + (tr.duration ?? 0), current)
  }

  /** The total size of tracks in the queue including the current track */
  public get totalSize(): number {
    return this.length + (this.current ? 1 : 0)
  }

  /** The size of the tracks in the queue */
  public get size(): number {
    return this.length
  }

  /** Add some track to the queue */
  @Queue.validateTracks()
  public add(
    tracks: (CoffeeTrack<T> | UnresolvedTrack<T>) | (CoffeeTrack<T> | UnresolvedTrack<T>)[],
    offset?: number
  ): void {
    if (typeof offset === "undefined" && typeof offset !== "number") {
      if (Array.isArray(tracks)) this.push(...tracks);
      else this.push(tracks);
    } else if (Array.isArray(tracks)) {
      this.splice(offset, 0, ...tracks)
    } else {
      this.splice(offset, 0, tracks)
    }
  }

  /** Removes an amount of tracks using a exclusive start and end exclusive index, returning the removed tracks, EXCLUDING THE `current` TRACK */
  @Queue.validatePosition()
  public remove(start: number, end?: number): (CoffeeTrack<T> | UnresolvedTrack<T>)[] {
    if (typeof end !== "undefined") return this.splice(start, end - start)
    return this.splice(start, 1)
  }

  /** Clear the queue */
  public clear(): void {
    this.length = 0
  }

  /** Shuffle the queue */
  public shuffle(): void {
    for (let i = this.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this[i], this[j]] = [this[j], this[i]];
    }
  }

  /** Progress to next song */
  public progress(): CoffeeTrack<T> | UnresolvedTrack<T> | undefined {
    this.previous = this.current
    this.current = this.shift()
    return this.current
  }
}

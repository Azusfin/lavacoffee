/* eslint-disable func-names */
import { CoffeeQueue } from "../../structures/CoffeeQueue"
import { CoffeeTrack, UnresolvedTrack } from "../../structures/CoffeeTrack"

export function decorateMethod(func: (method, ...args: any[]) => any) {
  return function decorate(_0, _1, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    descriptor.value = function (...args: any[]) {
      return func.apply(this, [method.bind(this), ...args])
    }
    return descriptor
  }
}

export namespace Queue {
  export function validateTracks(): (...args: any[]) => any {
    return decorateMethod(function (this: CoffeeQueue, func, trackOrTracks, offset) {
      const error = new TypeError("Parameter 'trackOrTracks' must be present and be a CoffeeTrack or UnresolvedTrack")

      if (Array.isArray(trackOrTracks) && trackOrTracks.length) {
        for (const track of trackOrTracks) {
          if (!(CoffeeTrack.isTrack(track) || UnresolvedTrack.isUnresolved(track))) throw error
        }
      } else if (!(CoffeeTrack.isTrack(trackOrTracks) || UnresolvedTrack.isUnresolved(trackOrTracks))) {
        throw error
      }

      if (typeof offset !== "undefined" && typeof offset === "number") {
        if (Number.isNaN(offset)) throw new TypeError("Parameter 'offset' must be a number")
        if (offset < 0 || offset > this.length) throw new RangeError(`Offset must be or between 0 and ${this.length}`)
      }

      return func(trackOrTracks)
    })
  }

  export function validatePosition(): (...args: any[]) => any {
    return decorateMethod(function (this: CoffeeQueue, func, start: number, end?: number) {
      if (
        typeof start !== "number" ||
        isNaN(start)
      ) throw new TypeError("Parameter 'start' must be present and be a number")

      if (start >= this.length) throw new RangeError(`Parameter 'start' can not be bigger than ${this.length}`)

      if (typeof end !== "undefined") {
        if (typeof end !== "number" || isNaN(end)) throw new TypeError("Parameter 'end' must be a number")
        if (start >= end) throw new RangeError("Parameter 'start' can not be bigger than end")
      }

      return func(start, end)
    })
  }
}

export function check(func: (method, ...args: any[]) => any): (...args: any[]) => any {
  return decorateMethod(func)
}

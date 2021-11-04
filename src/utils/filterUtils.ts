/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import { check } from "./decorators/validators"
import { construct } from "./decorators/constructs"
import { ChannelMix, Distortion, Equalizer, Filters, Karaoke, LowPass, Rotation, TimeScale, Tremolo, Vibrato } from "./filters"

/** Filters builder utility */
@construct(function (target: typeof FilterUtils, args) {
  const filters = args[0] as Filters ?? {}

  if (
    typeof filters !== "object" ||
    filters === null
  ) throw new TypeError("FilterUtils parameter 'filters' must be an object")

  return new target(filters)
})
export class FilterUtils {
  public volume?: number
  public equalizers: EqualizerUtils
  public karaoke: KaraokeUtils
  public timescale: TimescaleUtils
  public tremolo: TremoloUtils
  public vibrato: VibratoUtils
  public rotation: RotationUtils
  public distortion: DistortionUtils
  public channelMix: ChannelMixUtils
  public lowPass: LowPassUtils

  public constructor(filters: Filters) {
    this.volume = filters.volume
    this.equalizers = new EqualizerUtils(filters.equalizer)
    this.karaoke = new KaraokeUtils(filters.karaoke)
    this.timescale = new TimescaleUtils(filters.timescale)
    this.tremolo = new TremoloUtils(filters.tremolo)
    this.vibrato = new VibratoUtils(filters.vibrato)
    this.rotation = new RotationUtils(filters.rotation)
    this.distortion = new DistortionUtils(filters.distortion)
    this.channelMix = new ChannelMixUtils(filters.channelMix)
    this.lowPass = new LowPassUtils(filters.lowPass)
  }

  /** Set the filter volume */
  @check(function (this: FilterUtils, method, volume: number) {
    if (
      typeof volume !== "number" || isNaN(volume)
    ) throw new TypeError("Parameter 'volume' must be present and be a number")
    if (
      volume < 0
    ) throw new TypeError("Parameter 'volume' must be more or equal than 0")

    return method(volume)
  })
  public setVolume(volume: number): this {
    this.volume = volume
    return this
  }

  /** Build the filters */
  public build(): Filters {
    const filters: Filters = {}

    if (
      this.volume && !isNaN(this.volume) && this.volume !== 1
    ) filters.volume = this.volume

    if (
      this.equalizers.enabled
    ) filters.equalizer = this.equalizers.build()

    if (
      this.karaoke.enabled
    ) filters.karaoke = this.karaoke.build()

    if (
      this.timescale.enabled
    ) filters.timescale = this.timescale.build()

    if (
      this.tremolo.enabled
    ) filters.tremolo = this.tremolo.build()

    if (
      this.vibrato.enabled
    ) filters.vibrato = this.vibrato.build()

    if (
      this.rotation.enabled
    ) filters.rotation = this.rotation.build()

    if (
      this.distortion.enabled
    ) filters.distortion = this.distortion.build()

    if (
      this.channelMix.enabled
    ) filters.channelMix = this.channelMix.build()

    if (
      this.lowPass.enabled
    ) filters.lowPass = this.lowPass.build()

    return filters
  }
}

/** Equalizer filter builder utility */
@construct(function (target: typeof EqualizerUtils, args) {
  const equalizers = args[0] as Equalizer[]
  let enabled = false

  if (
    Array.isArray(equalizers) &&
    equalizers.length &&
    equalizers.some(eq => eq.gain !== 0)
  ) enabled = true

  const instance = new target(equalizers)
  instance.enabled = enabled

  return instance
})
export class EqualizerUtils {
  public enabled = false
  public readonly equalizers = new Map<number, Equalizer>()

  public constructor(equalizers?: Equalizer[]) {
    if (Array.isArray(equalizers)) {
      for (const equalizer of equalizers) {
        this.equalizers.set(equalizer.band, equalizer)
      }
    }
  }

  /** Set a band equalizer, band must be between 0 to 14, gain must be between -0.25 to 1 */
  @check(function (method, band: number, gain: number) {
    if (
      typeof band !== "number" || isNaN(band)
    ) throw new TypeError("Parameter 'band' must be present be a number")
    if (
      typeof gain !== "number" || isNaN(gain)
    ) throw new TypeError("Parameter 'gain' must be present and be a number")
    if (
      band < 0 || band > 14
    ) throw new TypeError("Parameter 'band' must be between 0 to 14")
    if (
      gain < -0.25 || gain > 1
    ) throw new TypeError("Parameter 'gain' must be between -0.25 to 1")
    return method(band, gain)
  })
  public setBand(band: number, gain: number): this {
    this.equalizers.set(band, { band, gain })
    if (gain !== 0) this.enabled = true
    else if (
      !this.equalizers.size ||
      [...this.equalizers.values()].every(eq => eq.gain === 0)
    ) this.enabled = false
    return this
  }

  /** Clear the equalizers filter */
  public clear(): this {
    this.equalizers.clear()
    this.enabled = false
    return this
  }

  /** Build the equalizers */
  public build(): Equalizer[] {
    const equalizers = [...this.equalizers.values()].filter(eq => eq.gain !== 0)

    // Pretty equalizers
    equalizers.sort((left, right) => left.band - right.band)

    return equalizers
  }
}

/** Karaoke filter builder utility */
@construct(function (target: typeof KaraokeUtils, args) {
  let karaoke = args[0] as Karaoke
  let enabled = false

  if (
    typeof karaoke === "object" &&
    karaoke !== null
  ) enabled = true
  else karaoke = { level: 1, monoLevel: 1, filterBand: 220, filterWidth: 100 }

  const instance = new target(karaoke)
  instance.enabled = enabled

  return instance
})
export class KaraokeUtils {
  public enabled = false
  public readonly karaoke: Karaoke

  public constructor(karaoke?: Karaoke) {
    this.karaoke = karaoke!
  }

  /** Set the level */
  @check(function (method, level: number) {
    if (
      typeof level !== "number" || isNaN(level)
    ) throw new TypeError("Parameter 'level' must be present and be a number")
    return method(level)
  })
  public setLevel(level: number): this {
    this.karaoke.level = level
    this.enabled = true
    return this
  }

  /** Set the mono level */
  @check(function (method, monoLevel: number) {
    if (
      typeof monoLevel !== "number" || isNaN(monoLevel)
    ) throw new TypeError("Parameter 'monoLevel' must be present and be a number")
    return method(monoLevel)
  })
  public setMonoLevel(monoLevel: number): this {
    this.karaoke.monoLevel = monoLevel
    this.enabled = true
    return this
  }

  /** Set the filter band */
  @check(function (method, filterBand: number) {
    if (
      typeof filterBand !== "number" || isNaN(filterBand)
    ) throw new TypeError("Parameter 'filterband' must be present and be a number")
    return method(filterBand)
  })
  public setFilterBand(filterBand: number): this {
    this.karaoke.filterBand = filterBand
    this.enabled = true
    return this
  }

  /** Set the filter width */
  @check(function (method, filterWidth: number) {
    if (
      typeof filterWidth !== "number" || isNaN(filterWidth)
    ) throw new TypeError("Parameter 'filterWidth' must be present and be a number")
    return method(filterWidth)
  })
  public setFilterWidth(filterWidth: number): this {
    this.karaoke.filterWidth = filterWidth
    this.enabled = true
    return this
  }

  /** Disable the karaoke filter */
  public disable(): this {
    this.enabled = false
    return this
  }

  /** Build the karaoke filter */
  public build(): Karaoke {
    return this.karaoke
  }
}

/** Timescale filter builder utility */
@construct(function (target: typeof TimescaleUtils, args) {
  let timescale = args[0] as TimeScale
  let enabled = false

  if (
    typeof timescale === "object" &&
    timescale !== null &&
    (
      timescale.speed !== 1 ||
      timescale.pitch !== 1 ||
      timescale.rate !== 1
    )
  ) enabled = true
  else timescale = { speed: 1, pitch: 1, rate: 1 }

  const instance = new target(timescale)
  instance.enabled = enabled

  return instance
})
export class TimescaleUtils {
  public enabled = false
  public readonly timescale: TimeScale

  public constructor(timescale?: TimeScale) {
    this.timescale = timescale!
  }

  /** Set the speed, must be more than 0 */
  @check(function (method, speed: number) {
    if (
      typeof speed !== "number" || isNaN(speed)
    ) throw new TypeError("Parameter 'speed' must be present and be a number")
    if (speed <= 0) throw new TypeError("Parameter 'speed' must be more than 0")
    return method(speed)
  })
  public setSpeed(speed: number): this {
    this.timescale.speed = speed
    if (speed !== 1) this.enabled = true
    else if (
      this.timescale.speed === 1 &&
      this.timescale.pitch === 1 &&
      this.timescale.rate === 1
    ) this.enabled = false
    return this
  }

  /** Set the pitch, must be more than 0 */
  @check(function (method, pitch: number) {
    if (
      typeof pitch !== "number" || isNaN(pitch)
    ) throw new TypeError("Parameter 'pitch' must be present and be a number")
    if (pitch <= 0) throw new TypeError("Parameter 'pitch' must be more than 0")
    return method(pitch)
  })
  public setPitch(pitch: number): this {
    this.timescale.pitch = pitch
    if (pitch !== 1) this.enabled = true
    else if (
      this.timescale.speed === 1 &&
      this.timescale.pitch === 1 &&
      this.timescale.rate === 1
    ) this.enabled = false
    return this
  }

  /** Set the rate, must be more than 0 */
  @check(function (method, rate: number) {
    if (
      typeof rate !== "number" || isNaN(rate)
    ) throw new TypeError("Parameter 'rate' must be present and be a number")
    if (rate <= 0) throw new TypeError("Parameter 'rate' must be more than 0")
    return method(rate)
  })
  public setRate(rate: number): this {
    this.timescale.rate = rate
    if (rate !== 1) this.enabled = true
    else if (
      this.timescale.speed === 1 &&
      this.timescale.pitch === 1 &&
      this.timescale.rate === 1
    ) this.enabled = false
    return this
  }

  /** Build the timescale filter */
  public build(): TimeScale {
    return this.timescale
  }
}

/** Tremolo filter builder utility */
@construct(function (target: typeof TremoloUtils, args) {
  let tremolo = args[0] as Tremolo
  let enabled = false

  if (
    typeof tremolo === "object" &&
    tremolo !== null &&
    tremolo.depth !== 0
  ) enabled = true
  else tremolo = { frequency: 2, depth: 0.5 }

  const instance = new target(tremolo)
  instance.enabled = enabled

  return instance
})
export class TremoloUtils {
  public enabled = false
  public readonly tremolo: Tremolo

  public constructor(tremolo?: Tremolo) {
    this.tremolo = tremolo!
  }

  /** Set the frequency, must be more than 0 */
  @check(function (method, frequency: number) {
    if (
      typeof frequency !== "number" || isNaN(frequency)
    ) throw new TypeError("Parameter 'frequency' must be present and be a number")
    if (frequency <= 0) throw new TypeError("Parameter 'frequency' must be more than 0")
    return method(frequency)
  })
  public setFrequency(frequency: number): this {
    this.tremolo.frequency = frequency
    return this
  }

  /** Set the depth, must be between 0 to 1 */
  @check(function (method, depth: number) {
    if (
      typeof depth !== "number" || isNaN(depth)
    ) throw new TypeError("Parameter 'depth' must be present and be a number")
    if (
      depth < 0 || depth > 1
    ) throw new TypeError("Parameter 'depth' must be between 0 to 1")
    return method(depth)
  })
  public setDepth(depth: number): this {
    this.tremolo.depth = depth
    this.enabled = depth !== 0
    return this
  }

  /** Build the tremolo filter */
  public build(): Tremolo {
    return this.tremolo
  }
}

/** Vibrato filter builder utility */
@construct(function (target: typeof VibratoUtils, args) {
  let vibrato = args[0] as Vibrato
  let enabled = false

  if (
    typeof vibrato === "object" &&
    vibrato !== null &&
    vibrato.depth !== 0
  ) enabled = true
  else vibrato = { frequency: 2, depth: 0.5 }

  const instance = new target(vibrato)
  instance.enabled = enabled

  return instance
})
export class VibratoUtils {
  public enabled = false
  public readonly vibrato: Vibrato

  public constructor(vibrato?: Vibrato) {
    this.vibrato = vibrato!
  }

  /** Set the frequency, must be between 0 and 15 */
  @check(function (method, frequency: number) {
    if (
      typeof frequency !== "number" || isNaN(frequency)
    ) throw new TypeError("Parameter 'frequency' must be present and be a number")
    if (
      frequency <= 0 ||
      frequency > 14
    ) throw new TypeError("Parameter 'frequency' must be between 0 and 15")
    return method(frequency)
  })
  public setFrequency(frequency: number): this {
    this.vibrato.frequency = frequency
    return this
  }

  /** Set the depth, must be between 0 to 1 */
  @check(function (method, depth: number) {
    if (
      typeof depth !== "number" || isNaN(depth)
    ) throw new TypeError("Parameter 'depth' must be present and be a number")
    if (
      depth < 0 || depth > 1
    ) throw new TypeError("Parameter 'depth' must be between 0 to 1")
    return method(depth)
  })
  public setDepth(depth: number): this {
    this.vibrato.depth = depth
    this.enabled = depth !== 0
    return this
  }

  /** Build the vibrato filter */
  public build(): Vibrato {
    return this.vibrato
  }
}

/** Rotation filter builder utility */
@construct(function (target: typeof RotationUtils, args) {
  let rotation = args[0] as Rotation
  let enabled = false

  if (
    typeof rotation === "object" &&
    rotation !== null &&
    rotation.rotationHz !== 0
  ) enabled = true
  else rotation = { rotationHz: 5 }

  const instance = new target(rotation)
  instance.enabled = enabled

  return instance
})
export class RotationUtils {
  public enabled = false
  public readonly rotation: Rotation

  public constructor(rotation?: Rotation) {
    this.rotation = rotation!
  }

  /** Set the rotation speed */
  @check(function (method, rotationHz: number) {
    if (
      typeof rotationHz !== "number" || isNaN(rotationHz)
    ) throw new TypeError("Parameter 'rotationHz' must be present and be a number")
    return method(rotationHz)
  })
  public setRotationSpeed(rotationHz: number): this {
    this.rotation.rotationHz = rotationHz
    this.enabled = rotationHz !== 0
    return this
  }

  /** Build the rotation filter */
  public build(): Rotation {
    return this.rotation
  }
}

/** Distortion filter builder utility */
@construct(function (target: typeof DistortionUtils, args) {
  let distortion = args[0] as Distortion
  let enabled = false

  if (
    typeof distortion === "object" &&
    distortion !== null &&
    (
      distortion.sinOffset !== 0 ||
      distortion.sinScale !== 1 ||
      distortion.cosOffset !== 0 ||
      distortion.cosScale !== 1 ||
      distortion.tanOffset !== 0 ||
      distortion.tanScale !== 1 ||
      distortion.offset !== 0 ||
      distortion.scale !== 1
    )
  ) {
    enabled = true
  } else {
    distortion = {
      sinOffset: 0,
      sinScale: 1,
      cosOffset: 0,
      cosScale: 1,
      tanOffset: 0,
      tanScale: 1,
      offset: 0,
      scale: 1
    }
  }

  const instance = new target(distortion)
  instance.enabled = enabled

  return instance
})
export class DistortionUtils {
  public enabled = false
  public distortion: Distortion

  public constructor(distortion?: Distortion) {
    this.distortion = distortion!
  }

  /** Set the sin offset */
  @check(function (method, sinOffset: number) {
    if (
      typeof sinOffset !== "number" || isNaN(sinOffset)
    ) throw new TypeError("Parameter 'sinOffset' must be present and be a number")
    return method(sinOffset)
  })
  public setSinOffset(sinOffset: number): this {
    this.distortion.sinOffset = sinOffset
    if (sinOffset !== 0) this.enabled = true
    else if (
      this.distortion.sinOffset === 0 &&
      this.distortion.sinScale === 1 &&
      this.distortion.cosOffset === 0 &&
      this.distortion.cosScale === 1 &&
      this.distortion.tanOffset === 0 &&
      this.distortion.tanScale === 1 &&
      this.distortion.offset === 0 &&
      this.distortion.scale === 1
    ) this.enabled = false
    return this
  }

  /** Set the sin scale */
  @check(function (method, sinScale: number) {
    if (
      typeof sinScale !== "number" || isNaN(sinScale)
    ) throw new TypeError("Parameter 'sinScale' must be present and be a number")
    return method(sinScale)
  })
  public setSinScale(sinScale: number): this {
    this.distortion.sinScale = sinScale
    if (sinScale !== 1) this.enabled = true
    else if (
      this.distortion.sinOffset === 0 &&
      this.distortion.sinScale === 1 &&
      this.distortion.cosOffset === 0 &&
      this.distortion.cosScale === 1 &&
      this.distortion.tanOffset === 0 &&
      this.distortion.tanScale === 1 &&
      this.distortion.offset === 0 &&
      this.distortion.scale === 1
    ) this.enabled = false
    return this
  }

  /** Set the cos offset */
  @check(function (method, cosOffset: number) {
    if (
      typeof cosOffset !== "number" || isNaN(cosOffset)
    ) throw new TypeError("Parameter 'cosOffset' must be present and be a number")
    return method(cosOffset)
  })
  public setCosOffset(cosOffset: number): this {
    this.distortion.cosOffset = cosOffset
    if (cosOffset !== 0) this.enabled = true
    else if (
      this.distortion.sinOffset === 0 &&
      this.distortion.sinScale === 1 &&
      this.distortion.cosOffset === 0 &&
      this.distortion.cosScale === 1 &&
      this.distortion.tanOffset === 0 &&
      this.distortion.tanScale === 1 &&
      this.distortion.offset === 0 &&
      this.distortion.scale === 1
    ) this.enabled = false
    return this
  }

  /** Set the cos scale */
  @check(function (method, cosScale: number) {
    if (
      typeof cosScale !== "number" || isNaN(cosScale)
    ) throw new TypeError("Parameter 'cosScale' must be present and be a number")
    return method(cosScale)
  })
  public setCosScale(cosScale: number): this {
    this.distortion.cosScale = cosScale
    if (cosScale !== 1) this.enabled = true
    else if (
      this.distortion.sinOffset === 0 &&
      this.distortion.sinScale === 1 &&
      this.distortion.cosOffset === 0 &&
      this.distortion.cosScale === 1 &&
      this.distortion.tanOffset === 0 &&
      this.distortion.tanScale === 1 &&
      this.distortion.offset === 0 &&
      this.distortion.scale === 1
    ) this.enabled = false
    return this
  }

  /** Set the tan offset */
  @check(function (method, tanOffset: number) {
    if (
      typeof tanOffset !== "number" || isNaN(tanOffset)
    ) throw new TypeError("Parameter 'tanOffset' must be present and be a number")
    return method(tanOffset)
  })
  public setTanOffset(tanOffset: number): this {
    this.distortion.tanOffset = tanOffset
    if (tanOffset !== 0) this.enabled = true
    else if (
      this.distortion.sinOffset === 0 &&
      this.distortion.sinScale === 1 &&
      this.distortion.cosOffset === 0 &&
      this.distortion.cosScale === 1 &&
      this.distortion.tanOffset === 0 &&
      this.distortion.tanScale === 1 &&
      this.distortion.offset === 0 &&
      this.distortion.scale === 1
    ) this.enabled = false
    return this
  }

  /** Set the tan scale */
  @check(function (method, tanScale: number) {
    if (
      typeof tanScale !== "number" || isNaN(tanScale)
    ) throw new TypeError("Parameter 'tanScale' must be present and be a number")
    return method(tanScale)
  })
  public setTanScale(tanScale: number): this {
    this.distortion.tanScale = tanScale
    if (tanScale !== 1) this.enabled = true
    else if (
      this.distortion.sinOffset === 0 &&
      this.distortion.sinScale === 1 &&
      this.distortion.cosOffset === 0 &&
      this.distortion.cosScale === 1 &&
      this.distortion.tanOffset === 0 &&
      this.distortion.tanScale === 1 &&
      this.distortion.offset === 0 &&
      this.distortion.scale === 1
    ) this.enabled = false
    return this
  }

  /** Set the offset */
  @check(function (method, offset: number) {
    if (
      typeof offset !== "number" || isNaN(offset)
    ) throw new TypeError("Parameter 'offset' must be present and be a number")
    return method(offset)
  })
  public setOffset(offset: number): this {
    this.distortion.offset = offset
    if (offset !== 0) this.enabled = true
    else if (
      this.distortion.sinOffset === 0 &&
      this.distortion.sinScale === 1 &&
      this.distortion.cosOffset === 0 &&
      this.distortion.cosScale === 1 &&
      this.distortion.tanOffset === 0 &&
      this.distortion.tanScale === 1 &&
      this.distortion.offset === 0 &&
      this.distortion.scale === 1
    ) this.enabled = false
    return this
  }

  /** Set the scale */
  @check(function (method, scale: number) {
    if (
      typeof scale !== "number" || isNaN(scale)
    ) throw new TypeError("Parameter 'scale' must be present and be a number")
    return method(scale)
  })
  public setScale(scale: number): this {
    this.distortion.scale = scale
    if (scale !== 1) this.enabled = true
    else if (
      this.distortion.sinOffset === 0 &&
      this.distortion.sinScale === 1 &&
      this.distortion.cosOffset === 0 &&
      this.distortion.cosScale === 1 &&
      this.distortion.tanOffset === 0 &&
      this.distortion.tanScale === 1 &&
      this.distortion.offset === 0 &&
      this.distortion.scale === 1
    ) this.enabled = false
    return this
  }

  /** Build the distortion filter */
  public build(): Distortion {
    return this.distortion
  }
}

/** ChannelMix filter builder utility */
@construct(function (target: typeof ChannelMixUtils, args) {
  let channelMix = args[0] as ChannelMix
  let enabled = false

  if (
    typeof channelMix === "object" &&
    channelMix !== null &&
    (
      channelMix.leftToLeft !== 1 ||
      channelMix.leftToRight !== 0 ||
      channelMix.rightToLeft !== 0 ||
      channelMix.rightToRight !== 1
    )
  ) {
    enabled = true
  } else {
    channelMix = {
      leftToLeft: 1,
      leftToRight: 0,
      rightToLeft: 0,
      rightToRight: 1
    }
  }

  const instance = new target(channelMix)
  instance.enabled = enabled

  return instance
})
export class ChannelMixUtils {
  public enabled = false
  public readonly channelMix: ChannelMix

  public constructor(channelMix?: ChannelMix) {
    this.channelMix = channelMix!
  }

  /** Set left to left mix, must be between 0 to 1 */
  @check(function (method, leftToLeft: number) {
    if (
      typeof leftToLeft !== "number" || isNaN(leftToLeft)
    ) throw new TypeError("Parameter 'leftToLeft' must be present and be a number")
    if (
      leftToLeft < 0 ||
      leftToLeft > 1
    ) throw new TypeError("Parameter 'leftToLeft' must be between 0 to 1")
    return method(leftToLeft)
  })
  public setLeftToLeft(leftToLeft: number): this {
    this.channelMix.leftToLeft = leftToLeft
    if (leftToLeft !== 1) this.enabled = true
    else if (
      this.channelMix.leftToLeft === 1 &&
      this.channelMix.leftToRight === 0 &&
      this.channelMix.rightToLeft === 0 &&
      this.channelMix.rightToRight === 1
    ) this.enabled = false
    return this
  }

  /** Set left to right mix, must be between 0 to 1 */
  @check(function (method, leftToRight: number) {
    if (
      typeof leftToRight !== "number" || isNaN(leftToRight)
    ) throw new TypeError("Parameter 'leftToRight' must be present and be a number")
    if (
      leftToRight < 0 ||
      leftToRight > 1
    ) throw new TypeError("Parameter 'leftToRight' must be between 0 to 1")
    return method(leftToRight)
  })
  public setLeftToRight(leftToRight: number): this {
    this.channelMix.leftToRight = leftToRight
    if (leftToRight !== 0) this.enabled = true
    else if (
      this.channelMix.leftToLeft === 1 &&
      this.channelMix.leftToRight === 0 &&
      this.channelMix.rightToLeft === 0 &&
      this.channelMix.rightToRight === 1
    ) this.enabled = false
    return this
  }

  /** Set right to left mix, must be between 0 to 1 */
  @check(function (method, rightToLeft: number) {
    if (
      typeof rightToLeft !== "number" || isNaN(rightToLeft)
    ) throw new TypeError("Parameter 'rightToLeft' must be present and be a number")
    if (
      rightToLeft < 0 ||
      rightToLeft > 1
    ) throw new TypeError("Parameter 'rightToLeft' must be between 0 to 1")
    return method(rightToLeft)
  })
  public setRightToLeft(rightToLeft: number): this {
    this.channelMix.rightToLeft = rightToLeft
    if (rightToLeft !== 0) this.enabled = true
    else if (
      this.channelMix.leftToLeft === 1 &&
      this.channelMix.leftToRight === 0 &&
      this.channelMix.rightToLeft === 0 &&
      this.channelMix.rightToRight === 1
    ) this.enabled = false
    return this
  }

  /** Set right to right mix, must be between 0 to 1 */
  @check(function (method, rightToRight: number) {
    if (
      typeof rightToRight !== "number" || isNaN(rightToRight)
    ) throw new TypeError("Parameter 'rightToRight' must be present and be a number")
    if (
      rightToRight < 0 ||
      rightToRight > 1
    ) throw new TypeError("Parameter 'rightToRight' must be between 0 to 1")
    return method(rightToRight)
  })
  public setRightToRight(rightToRight: number): this {
    this.channelMix.rightToRight = rightToRight
    if (rightToRight !== 1) this.enabled = true
    else if (
      this.channelMix.leftToLeft === 1 &&
      this.channelMix.leftToRight === 0 &&
      this.channelMix.rightToLeft === 0 &&
      this.channelMix.rightToRight === 1
    ) this.enabled = false
    return this
  }

  /** Build the channel mix filter */
  public build(): ChannelMix {
    return this.channelMix
  }
}

/** LowPass filter builder utility */
@construct(function (target: typeof LowPassUtils, args) {
  let lowPass = args[0] as LowPass
  let enabled = false

  if (
    typeof lowPass === "object" &&
    lowPass !== null &&
    lowPass.smoothing !== 20
  ) enabled = true
  else lowPass = { smoothing: 20 }

  const instance = new target(lowPass)
  instance.enabled = enabled

  return instance
})
export class LowPassUtils {
  public enabled = false
  public readonly lowPass: LowPass

  public constructor(lowPass?: LowPass) {
    this.lowPass = lowPass!
  }

  /** Set the smoothing */
  @check(function (method, smoothing: number) {
    if (
      typeof smoothing !== "number" || isNaN(smoothing)
    ) throw new TypeError("Parameter 'smoothing' must be present and be a number")
    return method(smoothing)
  })
  public setSmoothing(smoothing: number): this {
    this.lowPass.smoothing = smoothing
    this.enabled = smoothing !== 20
    return this
  }

  /** Build the low pass filter */
  public build(): LowPass {
    return this.lowPass
  }
}

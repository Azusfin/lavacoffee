export interface Filters {
  /** The volume filter */
  volume?: number
  /** The equalizer filters */
  equalizer?: Equalizer[]
  /** Uses equalization to eliminate part of a band, usually targeting vocals */
  karaoke?: Karaoke
  /** Changes the speed, pitch, and rate. All default to 1 */
  timescale?: TimeScale
  /** Uses amplification to create a shuddering effect, where the volume quickly oscillates */
  tremolo?: Tremolo
  /** Similar to tremolo. While tremolo oscillates the volume, vibrato oscillates the pitch */
  vibrato?: Vibrato
  /** Rotates the sound around the stereo channels/user headphones aka Audio Panning */
  rotation?: Rotation
  /** Distortion effect. It can generate some pretty unique audio effects */
  distortion?: Distortion
  /** Mixes both channels (left and right), with a configurable factor on how much each channel affects the other */
  channelMix?: ChannelMix
  /** Higher frequencies get suppressed, while lower frequencies pass through this filter, thus the name low pass */
  lowPass?: LowPass
}

export interface Equalizer {
  /** The equalizer band, can be 0-14 */
  band: number
  /** Multipler for the given band, can be 0.25 to 1.0 */
  gain: number
}

export interface Karaoke {
  level: number
  monoLevel: number
  filterBand: number
  filterWidth: number
}

export interface TimeScale {
  speed: number
  pitch: number
  rate: number
}

export interface Tremolo {
  /** 0 < x */
  frequency: number
  /** 0 < x <= 1 */
  depth: number
}

export interface Vibrato {
  /** 0 < x <= 14 */
  frequency: number
  /** 0 < x <= 1 */
  depth: number
}

export interface Rotation {
  /** The frequency of the audio rotating around the listener in Hz. 0.2 is similar to the example video above */
  rotationHz: number
}

export interface Distortion {
  sinOffset: number
  sinScale: number
  cosOffset: number
  cosScale: number
  tanOffset: number
  tanScale: number
  offset: number
  scale: number
}

export interface ChannelMix {
  leftToLeft: number
  leftToRight: number
  rightToLeft: number
  rightToRight: number
}

export interface LowPass {
  smoothing: number
}

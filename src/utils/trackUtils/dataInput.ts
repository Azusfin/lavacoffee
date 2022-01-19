const UTFChunks = 4096

/** A tool to work with binary data for track decoding */
export class DataInput {
  /** The binary data */
  public buffer: Buffer

  /** The message size */
  public size: number
  /** The message flags */
  public flags: number

  /** Current working position */
  public position = 0

  public constructor(buffer: Buffer) {
    this.buffer = buffer

    const info = this.readInt()

    this.size = info & 0x3FFFFFFF
    this.flags = ((info & 0xC0000000) >> 30)

    if (this.size !== this.buffer.byteLength - 4) throw new Error("Malformed data input message")
  }

  /** Read current byte */
  public read(): number {
    const int = this.buffer.readInt8(this.position)
    this.position++
    return int
  }

  /** Read current byte (unsigned) */
  public readU(): number {
    const uint = this.buffer.readUInt8(this.position)
    this.position++
    return uint
  }

  /** Read current byte as boolean */
  public readBool(): boolean {
    return this.read() !== 0
  }

  /** Read current byte and next byte as short (16 bit) */
  public readShort(): number {
    const int = this.buffer.readInt16BE(this.position)
    this.position += 2
    return int
  }

  /** Read current byte and next byte as short (16 bit) (unsigned) */
  public readUShort(): number {
    const uint = this.buffer.readUInt16BE(this.position)
    this.position += 2
    return uint
  }

  /** Read current byte and next 3 bytes as int (32 bit) */
  public readInt(): number {
    const int = this.buffer.readInt32BE(this.position)
    this.position += 4
    return int
  }

  /** Read current byte and next 3 bytes as int (32 bit) (unsigned) */
  public readUInt(): number {
    const uint = this.buffer.readUInt32BE(this.position)
    this.position += 4
    return uint
  }

  /** Read current byte and next 3 bytes as float (32 bit) */
  public readFloat(): number {
    const float = this.buffer.readFloatBE(this.position)
    this.position += 4
    return float
  }

  /** Read current byte and next 7 bytes as long (64 bit) (bigint) */
  public readBigLong(): bigint {
    const long = this.buffer.readBigInt64BE(this.position)
    this.position += 8
    return long
  }

  /** Read current byte and next 7 bytes as long (64 bit) (bigint) (unsigned) */
  public readBigULong(): bigint {
    const ulong = this.buffer.readBigUInt64BE(this.position)
    this.position += 8
    return ulong
  }

  /** Read current byte and next 7 bytes as long (64 bit) */
  public readLong(): number {
    return Number(this.readBigLong())
  }

  /** Read current byte and next 7 bytes as long (64 bit) (unsigned) */
  public readULong(): number {
    return Number(this.readBigULong())
  }

  /** Read current byte and next 7 bytes as double (64 bit) */
  public readDouble(): number {
    const double = this.buffer.readDoubleBE(this.position)
    this.position += 8
    return double
  }

  /** Read current byte and next arbitrary bytes as modified utf-8 string */
  public readUTF(): string {
    const length = this.readUShort()

    let str = ""
    const chars: number[] = []
    const bytes = this.buffer.slice(this.position, this.position + length)

    let index = 0

    while (index < length) {
      const char = bytes[index] & 0xff

      if (char > 127) break

      index++
      chars.push(char)

      if (chars.length >= UTFChunks) {
        str += String.fromCharCode(...chars)
        chars.length = 0
      }
    }

    while (index < length) {
      const char = bytes[index++] & 0xff

      switch (char >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          // 0xxxxxxx
          chars.push(char)
          break
        case 12:
        case 13:
          // 110x xxxx   10xx xxxx
          {
            const char2 = bytes[index++]
            chars.push(((char & 0x1f) << 6) | (char2 & 0x3f))
          }
          break
        case 14:
          // 1110 xxxx   10xx xxxx   10xx xxxx
          {
            const char2 = bytes[index++]
            const char3 = bytes[index++]
            chars.push(((char & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0))
          }
          break
      }

      if (chars.length >= UTFChunks) {
        str += String.fromCharCode(...chars)
        chars.length = 0
      }
    }

    if (chars.length) {
      str += String.fromCharCode(...chars)
      chars.length = 0
    }

    this.position += length

    return str
  }

  /** Try read text from the binary data otherwise undefined */
  public readNullableText(): string | undefined {
    const isAvailable = this.readBool()
    if (isAvailable) return this.readUTF()
  }
}

const InitialSize = 2048

/** A tool to work with binary data for track encoding */
export class DataOutput {
  /** The binary data */
  public buffer = Buffer.alloc(InitialSize)
  /** The binary data size */
  public size = 0

  /** Commit and get the binary data */
  public commit(flags?: number): Buffer {
    let info = this.size

    if (typeof flags === "number" && !isNaN(flags)) {
      info |= flags << 30
    }

    const buffer = Buffer.alloc(4 + this.size)
    buffer.writeInt32BE(info)
    buffer.set(this.buffer.slice(0, this.size), 4)

    this.size = 0

    return buffer
  }

  /** Ensure binary data size */
  public ensure(size: number): boolean {
    if (this.buffer.length < this.size + size) {
      const buffer = Buffer.alloc(this.size * 2)
      buffer.set(this.buffer)
      this.buffer = buffer

      return true
    }

    return false
  }

  /** Write integer to current byte */
  public write(int: number): number {
    this.ensure(1)
    return this.buffer.writeInt8(int, this.size++)
  }

  /** Write unsigned integer to current byte */
  public writeU(uint: number): number {
    this.ensure(1)
    return this.buffer.writeUInt8(uint, this.size++)
  }

  /** Write boolean to current byte */
  public writeBool(bool: boolean): number {
    return this.write(bool ? 1 : 0)
  }

  /** Write 16 bit integer to current byte and next byte */
  public writeShort(int: number): number {
    this.ensure(2)
    this.buffer.writeUInt16BE(int, this.size)
    this.size += 2
    return 2
  }

  /** Write 16 bit unsigned integer to current byte and next byte */
  public writeUShort(uint: number): number {
    this.ensure(2)
    this.buffer.writeUInt16BE(uint, this.size)
    this.size += 2
    return 2
  }

  /** Write 32 bit integer to current byte and next 3 bytes */
  public writeInt(int: number): number {
    this.ensure(4)
    this.buffer.writeInt32BE(int, this.size)
    this.size += 4
    return 4
  }

  /** Write 32 bit unsigned integer to current byte and next 3 bytes */
  public writeUInt(uint: number): number {
    this.ensure(4)
    this.buffer.writeUInt32BE(uint, this.size)
    this.size += 4
    return 4
  }

  /** Write 32 bit float to current byte and next 3 bytes */
  public writeFloat(float: number): number {
    this.ensure(4)
    this.buffer.writeFloatBE(float, this.size)
    this.size += 4
    return 4
  }

  /** Write 64 bit bigint long to current byte and next 7 bytes */
  public writeBigLong(long: bigint): number {
    this.ensure(8)
    this.buffer.writeBigInt64BE(long, this.size)
    this.size += 8
    return 8
  }

  /** Write 64 bit bigint unsigned long to current byte and next 7 bytes */
  public writeBigULong(ulong: bigint): number {
    this.ensure(8)
    this.buffer.writeBigUInt64BE(ulong, this.size)
    this.size += 8
    return 8
  }

  /** Write 64 bit long to current byte and next 7 bytes */
  public writeLong(long: number): number {
    return this.writeBigLong(BigInt(long))
  }

  /** Write 64 bit unsigned long to current byte and next 7 bytes */
  public writeULong(ulong: number): number {
    return this.writeBigULong(BigInt(ulong))
  }

  /** Write 64 bit double to current byte and next 7 bytes */
  public writeDouble(double: number): number {
    this.ensure(8)
    this.buffer.writeDoubleBE(double, this.size)
    this.size += 8
    return 8
  }

  /** Write modified utf-8 text to current byte and next arbitrary bytes */
  public writeUTF(str: string): number {
    const strLength = str.length
    let utfLength = strLength

    for (let i = 0; i < strLength; i++) {
      const char = str.charCodeAt(i)
      if (char >= 0x80 || char === 0) {
        utfLength = (char >= 0x800) ? 2 : 1
      }
    }

    if (utfLength > 65535) throw new Error("String is too long (max 65535)")

    this.writeUShort(utfLength)
    this.ensure(utfLength)

    let index = 0

    for (; index < strLength; index++) {
      const char = str.charCodeAt(index)
      if (char >= 0x80 || char === 0) break
      this.writeU(char)
    }

    for (; index < strLength; index++) {
      const char = str.charCodeAt(index)

      if (char < 0x80 && char !== 0) {
        this.writeU(char)
      } else if (char >= 0x800) {
        this.writeU(0xe0 | ((char >> 12) & 0x0f))
        this.writeU(0x80 | ((char >> 6) & 0x3f))
        this.writeU(0x80 | ((char >> 0) & 0x3f))
      } else {
        this.writeU(0xc0 | ((char >> 6) & 0x1f))
        this.writeU(0x80 | ((char >> 0) & 0x3f))
      }
    }

    return utfLength + 2
  }

  /** Try write text to the binary data */
  public writeNullableText(str?: string): number {
    this.writeBool(typeof str === "string")
    if (typeof str !== "string") return 1
    return this.writeUTF(str) + 1
  }
}

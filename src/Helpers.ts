export interface GetNullTerminatedStringResult {
    string: string;
    bytesRead: number; // does not include the NULL-terminator
}

export function getNullTerminatedUtf8String(view: DataView, offset: number): GetNullTerminatedStringResult {
    let length = 0;
    while (length + offset < view.byteLength && view.getUint8(offset + length) != 0) {
        ++length;
    }

    if (length + offset >= view.byteLength) {
        throw "Reached end of view without encountering NULL-terminator";
    }

    return {
        string: getUtf8String(view, offset, length),
        bytesRead: length,
    }
}

export function getUtf8StringFromWholeBuffer(buffer: AllowSharedBufferSource): string {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(buffer);
}

export function getUtf8String(buffer: ArrayBufferLike | DataView, offset: number, length: number): string {
    let bufferView;
    if (buffer instanceof DataView)
    {
        bufferView = new DataView(buffer.buffer, buffer.byteOffset + offset, length);
    }
    else {
        bufferView = new DataView(buffer, offset, length);
    }
    return getUtf8StringFromWholeBuffer(bufferView);
}

export function roundUpToNearest(value: number, roundFactor: number): number {
    return Math.ceil(value / roundFactor) * roundFactor;
}

export function getBoolArrayFromBitmask(bitmask: bigint): boolean[] {
    const result: boolean[] = [];
    for (let i = 0n; i < 64n; ++i) {
        result.push((bitmask & (1n << i)) !== 0n);
    }
    return result;
}
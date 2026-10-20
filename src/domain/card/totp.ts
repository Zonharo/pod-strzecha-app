const rotl = (x: number, n: number): number => ((x << n) | (x >>> (32 - n))) >>> 0;

export const sha1 = (message: Uint8Array): Uint8Array => {
  const bitLength = message.length * 8;
  const paddedLength = (((message.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3]! ^ w[i - 8]! ^ w[i - 14]! ^ w[i - 16]!, 1);

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i++) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + w[i]!) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  [h0, h1, h2, h3, h4].forEach((h, i) => outView.setUint32(i * 4, h));
  return out;
};

const BLOCK = 64;

export const hmacSha1 = (key: Uint8Array, message: Uint8Array): Uint8Array => {
  const normalizedKey = key.length > BLOCK ? sha1(key) : key;
  const block = new Uint8Array(BLOCK);
  block.set(normalizedKey);
  const inner = new Uint8Array(BLOCK + message.length);
  const outer = new Uint8Array(BLOCK + 20);
  for (let i = 0; i < BLOCK; i++) {
    inner[i] = block[i]! ^ 0x36;
    outer[i] = block[i]! ^ 0x5c;
  }
  inner.set(message, BLOCK);
  outer.set(sha1(inner), BLOCK);
  return sha1(outer);
};

export const hexToBytes = (hex: string): Uint8Array => {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(hex)) throw new Error('Nieprawidłowy sekret karty');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
};

export const hotp = (secret: Uint8Array, counter: number, digits = 6): string => {
  const message = new Uint8Array(8);
  const view = new DataView(message.buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  const hash = hmacSha1(secret, message);
  const offset = hash[19]! & 0x0f;
  const binary =
    ((hash[offset]! & 0x7f) << 24) |
    (hash[offset + 1]! << 16) |
    (hash[offset + 2]! << 8) |
    hash[offset + 3]!;
  return String(binary % 10 ** digits).padStart(digits, '0');
};

export type TotpConfig = { periodSeconds: number; digits: number };

export const totpCounter = (nowMs: number, periodSeconds: number): number =>
  Math.floor(nowMs / 1000 / periodSeconds);

export const totp = (secret: Uint8Array, nowMs: number, config: TotpConfig): string =>
  hotp(secret, totpCounter(nowMs, config.periodSeconds), config.digits);

export const secondsUntilNextCode = (nowMs: number, periodSeconds: number): number =>
  periodSeconds - (Math.floor(nowMs / 1000) % periodSeconds);

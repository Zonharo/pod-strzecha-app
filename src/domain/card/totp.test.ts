import { describe, expect, it } from 'vitest';

import { hexToBytes, hmacSha1, hotp, secondsUntilNextCode, sha1, totp } from './totp';

const ascii = (text: string) => new TextEncoder().encode(text);
const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

describe('sha1', () => {
  it.each([
    ['', 'da39a3ee5e6b4b0d3255bfef95601890afd80709'],
    ['abc', 'a9993e364706816aba3e25717850c26c9cd0d89d'],
    [
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '84983e441c3bd26ebaae4aa1f95129e5e54670f1',
    ],
  ])('sha1(%j)', (input, expected) => {
    expect(hex(sha1(ascii(input)))).toBe(expected);
  });

  it('długa wiadomość (wiele bloków)', () => {
    expect(hex(sha1(ascii('a'.repeat(1000))))).toBe('291e9a6c66994949b57ba5e650361e98fc36b1ba');
  });
});

describe('hmacSha1 (RFC 2202)', () => {
  it('przypadek 1', () => {
    expect(hex(hmacSha1(new Uint8Array(20).fill(0x0b), ascii('Hi There')))).toBe(
      'b617318655057264e28bc0b6fb378c8ef146be00',
    );
  });

  it('przypadek 2', () => {
    expect(hex(hmacSha1(ascii('Jefe'), ascii('what do ya want for nothing?')))).toBe(
      'effcdf6ae5eb2fa2d27416d5f184df9c259a7c79',
    );
  });

  it('klucz dłuższy niż blok', () => {
    expect(
      hex(
        hmacSha1(
          new Uint8Array(80).fill(0xaa),
          ascii('Test Using Larger Than Block-Size Key - Hash Key First'),
        ),
      ),
    ).toBe('aa4ae5e15272d00e95705637ce8a3b55ed402112');
  });
});

describe('hotp (RFC 4226)', () => {
  const secret = ascii('12345678901234567890');
  const expected = [
    '755224',
    '287082',
    '359152',
    '969429',
    '338314',
    '254676',
    '287922',
    '162583',
    '399871',
    '520489',
  ];

  it.each(expected.map((code, counter) => [counter, code]))('licznik %i → %s', (counter, code) => {
    expect(hotp(secret, counter)).toBe(code);
  });
});

describe('totp (RFC 6238, SHA-1)', () => {
  const secret = ascii('12345678901234567890');
  it.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
    [20000000000, '65353130'],
  ])('czas %i → %s', (seconds, code) => {
    expect(totp(secret, seconds * 1000, { periodSeconds: 30, digits: 8 })).toBe(code);
  });
});

describe('secondsUntilNextCode', () => {
  it('liczy do końca okna', () => {
    expect(secondsUntilNextCode(0, 30)).toBe(30);
    expect(secondsUntilNextCode(29_999, 30)).toBe(1);
    expect(secondsUntilNextCode(45_000, 30)).toBe(15);
  });
});

describe('hexToBytes', () => {
  it('odrzuca zły zapis', () => {
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
    expect([...hexToBytes('00ff10')]).toEqual([0, 255, 16]);
  });
});

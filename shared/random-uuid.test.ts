import { afterEach, describe, expect, it, vi } from 'vitest';
import { newTransferGroupId, randomUuid, TRANSFER_GROUP_PREFIX } from './sync-core.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('randomUuid', () => {
  it('uses crypto.randomUUID when the host provides it', () => {
    const randomUUID = vi.fn(() => '12345678-1234-4123-8123-123456789abc');
    vi.stubGlobal('crypto', { randomUUID, getRandomValues: vi.fn() });

    expect(randomUuid()).toBe('12345678-1234-4123-8123-123456789abc');
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it('builds an RFC 4122 v4 UUID when randomUUID is absent', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.set(Array.from({ length: 16 }, (_, index) => index));
        return bytes;
      },
    });

    expect(randomUuid()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
  });

  it('keeps the internal-transfer prefix with the fallback', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(0xaa);
        return bytes;
      },
    });

    expect(newTransferGroupId()).toMatch(
      new RegExp(`^${TRANSFER_GROUP_PREFIX}[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`),
    );
  });

  it('fails clearly when the host has no secure RNG', () => {
    vi.stubGlobal('crypto', {});
    expect(() => randomUuid()).toThrow('Secure random number generation is unavailable');
  });
});

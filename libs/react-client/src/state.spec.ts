import { describe, expect, it } from 'vitest';

import { migrateStoredMcps } from './state';

describe('migrateStoredMcps', () => {
  it('marks a legacy user-provided entry (url + clientType, no isUserProvided) as user-provided', () => {
    const legacy = [
      {
        name: 'my-sse-server',
        tools: [{ name: 'search' }],
        status: 'connected',
        clientType: 'sse',
        url: 'https://example.com/mcp'
      }
    ];

    const migrated = migrateStoredMcps(legacy);

    expect(migrated).toHaveLength(1);
    expect(migrated[0].isUserProvided).toBe(true);
  });

  it('leaves a named (developer-configured) entry without url alone', () => {
    const named = [
      {
        name: 'my-named-server',
        tools: [{ name: 'search' }],
        status: 'connected',
        type: 'stdio'
      }
    ];

    const migrated = migrateStoredMcps(named);

    expect(migrated).toHaveLength(1);
    expect(migrated[0].isUserProvided).toBeUndefined();
  });

  it('does not override an explicit isUserProvided value already present', () => {
    const alreadyTagged = [
      {
        name: 'my-sse-server',
        tools: [],
        status: 'failed',
        clientType: 'sse',
        url: 'https://example.com/mcp',
        isUserProvided: false
      }
    ];

    const migrated = migrateStoredMcps(alreadyTagged);

    expect(migrated[0].isUserProvided).toBe(false);
  });

  it.each([
    ['null', null],
    ['a string', 'not-an-array'],
    ['a number', 42],
    ['a plain object', { name: 'oops' }],
    ['undefined', undefined]
  ])('returns an empty array when the stored value is %s', (_label, value) => {
    expect(migrateStoredMcps(value)).toEqual([]);
  });

  it('drops malformed entries instead of throwing', () => {
    const mixed = [
      null,
      undefined,
      'garbage',
      42,
      {},
      { name: 'missing-tools-and-status' },
      {
        name: 'legacy-valid',
        tools: [{ name: 'search' }],
        status: 'connected',
        clientType: 'streamable-http',
        url: 'https://example.com/mcp'
      }
    ];

    expect(() => migrateStoredMcps(mixed)).not.toThrow();

    const migrated = migrateStoredMcps(mixed);
    expect(migrated).toHaveLength(1);
    expect(migrated[0].name).toBe('legacy-valid');
    expect(migrated[0].isUserProvided).toBe(true);
  });

  it('backfills type for a legacy named stdio entry (clientType: stdio, no url)', () => {
    const legacyStdio = [
      {
        name: 'my-stdio-server',
        tools: [{ name: 'search' }],
        status: 'connected',
        clientType: 'stdio'
      }
    ];

    const migrated = migrateStoredMcps(legacyStdio);

    expect(migrated).toHaveLength(1);
    expect(migrated[0].type).toBe('stdio');
    expect(migrated[0].isUserProvided).toBeUndefined();
  });

  it('does not backfill type for a legacy user-provided sse entry that has a url', () => {
    const legacySse = [
      {
        name: 'my-sse-server',
        tools: [{ name: 'search' }],
        status: 'connected',
        clientType: 'sse',
        url: 'https://example.com/mcp'
      }
    ];

    const migrated = migrateStoredMcps(legacySse);

    expect(migrated).toHaveLength(1);
    expect(migrated[0].type).toBeUndefined();
  });

  it('leaves an already-correct named entry (type set, no clientType) unchanged', () => {
    const named = [
      {
        name: 'my-named-server',
        tools: [{ name: 'search' }],
        status: 'connected',
        type: 'stdio'
      }
    ];

    const migrated = migrateStoredMcps(named);

    expect(migrated).toHaveLength(1);
    expect(migrated[0]).toEqual(named[0]);
  });

  it('drops an entry whose `type` is an object instead of a string', () => {
    const malicious = [
      {
        name: 'x',
        tools: [{ name: 'a' }],
        status: 'connected',
        type: { evil: 1 }
      }
    ];

    expect(migrateStoredMcps(malicious)).toEqual([]);
  });

  it('drops an entry whose `url` is not a string', () => {
    const malformed = [
      {
        name: 'x',
        tools: [{ name: 'a' }],
        status: 'connected',
        clientType: 'sse',
        url: 12345
      }
    ];

    expect(migrateStoredMcps(malformed)).toEqual([]);
  });

  it('drops an entry whose `headers` is not a plain string->string record', () => {
    const nonObjectHeaders = [
      {
        name: 'x',
        tools: [{ name: 'a' }],
        status: 'connected',
        clientType: 'sse',
        url: 'https://example.com/mcp',
        headers: 'not-an-object'
      }
    ];
    const arrayHeaders = [
      {
        name: 'x',
        tools: [{ name: 'a' }],
        status: 'connected',
        clientType: 'sse',
        url: 'https://example.com/mcp',
        headers: ['a', 'b']
      }
    ];
    const nonStringValueHeaders = [
      {
        name: 'x',
        tools: [{ name: 'a' }],
        status: 'connected',
        clientType: 'sse',
        url: 'https://example.com/mcp',
        headers: { Authorization: 123 }
      }
    ];

    expect(migrateStoredMcps(nonObjectHeaders)).toEqual([]);
    expect(migrateStoredMcps(arrayHeaders)).toEqual([]);
    expect(migrateStoredMcps(nonStringValueHeaders)).toEqual([]);
  });

  it('keeps legitimate legacy shapes alongside malformed entries that must be dropped', () => {
    const mixed = [
      // Legacy named stdio server (clientType: 'stdio', no url) -- must be healed and kept.
      {
        name: 'my-stdio-server',
        tools: [{ name: 'search' }],
        status: 'connected',
        clientType: 'stdio'
      },
      // Legacy user-provided sse/streamable-http server with a url -- must be kept.
      {
        name: 'my-sse-server',
        tools: [{ name: 'search' }],
        status: 'connected',
        clientType: 'sse',
        url: 'https://example.com/mcp',
        headers: { Authorization: 'Bearer token' }
      },
      // Malformed entries that a hardened guard must drop.
      {
        name: 'evil-type',
        tools: [{ name: 'a' }],
        status: 'connected',
        type: { evil: 1 }
      },
      {
        name: 'evil-url',
        tools: [{ name: 'a' }],
        status: 'connected',
        clientType: 'sse',
        url: { evil: 1 }
      },
      {
        name: 'evil-headers',
        tools: [{ name: 'a' }],
        status: 'connected',
        clientType: 'sse',
        url: 'https://example.com/mcp',
        headers: { evil: 1 }
      }
    ];

    const migrated = migrateStoredMcps(mixed);

    expect(migrated).toHaveLength(2);
    expect(migrated.map((mcp) => mcp.name).sort()).toEqual([
      'my-sse-server',
      'my-stdio-server'
    ]);
    const stdio = migrated.find((mcp) => mcp.name === 'my-stdio-server');
    expect(stdio?.type).toBe('stdio');
    expect(stdio?.isUserProvided).toBeUndefined();
    const sse = migrated.find((mcp) => mcp.name === 'my-sse-server');
    expect(sse?.isUserProvided).toBe(true);
  });
});

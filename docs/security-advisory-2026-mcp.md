# Security Advisory: MCP Endpoint Vulnerabilities

**Advisory ID**: SPL-2026-001 / SPL-2026-002  
**Severity**: Critical (SPL-2026-001, CVSS v3.1: 9.8) / High (SPL-2026-002, CVSS v3.1: 7.2)  
**Affected versions**: v2.4.0rc0 – v2.11.x (all versions with `features.mcp.enabled = true`)  
**Fixed in**: v2.12.0  
**Reported by**: SPL Security (vipin@spl.team, stephen@spl.team), 2026-04-08

---

## Summary

Two vulnerabilities were identified in Chainlit's `/mcp` endpoint, which handles Model Context
Protocol connectivity. Both require `features.mcp.enabled = true` (disabled by default since
v2.7.0) to be exploitable.

| ID           | Title                              | CVSS v3.1 | Severity |
| ------------ | ---------------------------------- | --------- | -------- |
| SPL-2026-001 | Command Injection via MCP stdio    | 9.8       | Critical |
| SPL-2026-002 | SSRF via MCP streamable-http / SSE | 7.2       | High     |

---

## SPL-2026-001 — Command Injection via MCP stdio

### Description

The `POST /mcp` endpoint accepted a user-supplied `fullCommand` string when `clientType` was
`"stdio"`. This string was validated only by checking the executable name against a configurable
allowlist (`allowed_executables`) — arguments were passed through unchecked.

Because `npx` (the default allowed executable) supports `-c` for arbitrary shell execution,
an attacker could send:

```json
{
  "sessionId": "<valid session>",
  "clientType": "stdio",
  "fullCommand": "npx -y -c 'id > /tmp/pwned'"
}
```

The server spawned the subprocess before the MCP handshake completed, so the shell command
executed even though the MCP connection subsequently failed. This gave an unauthenticated
attacker full code execution on the host running Chainlit.

**Root cause**: The design placed subprocess command construction in client-controlled input.
No argument-level filtering can safely sandbox this because the attacker controls the full
argument list.

### Impact

An unauthenticated remote attacker can execute arbitrary shell commands on the Chainlit server
with the privileges of the Chainlit process. This allows reading and writing files, exfiltrating
secrets, installing backdoors, and pivoting into internal networks.

### Affected configuration

Any Chainlit deployment with:

```toml
[features.mcp]
enabled = true
```

MCP is disabled by default (`enabled = false`) since v2.7.0.

---

## SPL-2026-002 — SSRF via MCP streamable-http / SSE

### Description

The `POST /mcp` endpoint accepted arbitrary `url` and `headers` from the client when
`clientType` was `"sse"` or `"streamable-http"`. The URL was passed directly to the MCP SDK's
HTTP client with no scheme check, no hostname validation, and no allowlist. The attacker also
controlled all HTTP headers, enabling header injection attacks.

An attacker could force the Chainlit server to make outbound HTTP requests to internal
services (cloud metadata endpoints, internal APIs, databases) and forge sensitive headers
(`Authorization`, `Cookie`, `X-Internal-Secret`) in those requests:

```json
{
  "sessionId": "<valid session>",
  "clientType": "streamable-http",
  "url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
  "headers": { "Authorization": "Bearer attacker-controlled-token" }
}
```

This is a blind SSRF — response bodies are consumed by the MCP client and not returned to
the attacker — but it enables service discovery, port scanning, metadata endpoint probing,
and side-effect attacks via header injection.

### Impact

An unauthenticated remote attacker can cause the Chainlit server to make arbitrary outbound
HTTP requests to internal network hosts, forge HTTP headers on those requests, and probe
cloud instance metadata services.

---

## Fix

### SPL-2026-001 (Critical) — Architectural fix

The `fullCommand` field has been **removed from the client request entirely**. stdio MCP
servers are now defined exclusively in server-side configuration (`.chainlit/config.toml`).
The client sends only a `name` to activate a pre-configured server:

**Before (v2.11.x, vulnerable):**

```json
{
  "sessionId": "...",
  "clientType": "stdio",
  "fullCommand": "npx -y @mcp/github"
}
```

**After (v2.12.0, fixed):**

```toml
# .chainlit/config.toml (developer-controlled)
[[features.mcp.servers]]
name = "github"
type = "stdio"
command = "npx -y @modelcontextprotocol/server-github"
```

```json
{ "sessionId": "...", "name": "github" }
```

The server looks up the command from its own config and spawns the subprocess. The client
cannot influence the command string in any way.

### SPL-2026-002 (High) — Defence-in-depth improvements

User-provided SSE/HTTP connections now require an explicit opt-in (`user_servers.enabled = true`)
and an URL allowlist. Additionally:

- URL scheme enforced to `http`/`https` only
- URL allowlist uses parsed-component comparison (prevents subdomain/userinfo bypass)
- Path prefix matching normalised to prevent sibling-path bypass (e.g. `/v1-evil` no longer
  matches an allowlist entry of `/v1`)
- Dangerous HTTP headers (`Cookie`, `Host`, `X-Forwarded-*`, `Proxy-Authorization`, etc.)
  are stripped before forwarding
- **HTTP redirects are not followed, for developer-configured ("named") servers as well as
  user-provided ones.** The MCP Python SDK hardcodes `follow_redirects=True` on the httpx
  client it builds internally, which means only the _first_ hop of a connection would ever be
  checked against our destination allowlist (user-provided servers) or origin pin (named
  servers) — a permitted server could 302 the connection anywhere. httpx forwards every
  request header except `Authorization` and `Cookie` to a redirect target, so a configured API
  key carried in a custom header could leak to the redirect destination. `mcp.py`'s
  `make_mcp_http_client_factory` overrides this with `follow_redirects=False` on the client it
  hands to both transports, and re-validates every outgoing request (not just the initial URL)
  against the same `check_destination` hook. That last part also closes a related gap: the SSE
  transport takes its POST target from the server's own `endpoint` event at runtime, and the
  SDK accepts any same-origin value for it — including one outside the path subtree an
  allowlist entry granted. That a configured server's own runtime instructions can move its
  destination this way is the reason named servers get the same redirect and
  destination-recheck treatment as user-provided ones: the trust boundary is identical, so
  hardening only one side would have been inconsistent. Deployments that relied on a redirect
  to reach their real MCP endpoint should configure the final `https://` URL directly.

**Recommended configuration (opt-in user servers):**

```toml
[features.mcp.user_servers]
enabled = true
allowed_urls = ["https://mcp.example.com"]  # only permit specific origins
```

---

## Mitigation for users who cannot upgrade immediately

If upgrading to v2.12.0 is not immediately possible:

1. **Disable MCP entirely** — set `features.mcp.enabled = false` in your config (this is
   the default). This fully prevents exploitation of both vulnerabilities.

2. **Restrict network access** — place the Chainlit server behind a firewall that prevents
   outbound connections to internal networks and cloud metadata endpoints.

3. **Enable authentication** — configure `@cl.password_auth_callback`, `@cl.header_auth_callback`,
   or OAuth so that the `/mcp` endpoint requires a valid user session. Anonymous access
   significantly lowers the bar for exploitation.

---

## Credit

Reported by Vipin and Stephen at SPL Security (security@spl.team) under coordinated disclosure.
The report included working proof-of-concept exploits for both vulnerabilities tested against
Chainlit v2.11.0. We thank SPL Security for the thorough, responsibly disclosed report.

---

## Timeline

| Date       | Event                                    |
| ---------- | ---------------------------------------- |
| 2026-04-08 | Report received from SPL Security        |
| 2026-04-08 | Vulnerabilities confirmed by maintainers |
| 2026-04-xx | Fix merged (this PR)                     |
| 2026-xx-xx | v2.12.0 released                         |
| 2026-xx-xx | Advisory published                       |

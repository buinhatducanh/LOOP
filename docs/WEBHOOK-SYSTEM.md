# Webhook System

> **Updated:** 2026-03-26 | **Status:** ✅ Implemented

---

## Endpoints

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `POST /api/webhooks/github/[projectId]` | GitHub push + PR webhook ingestion | HMAC (`X-Hub-Signature-256`) |
| `POST /api/webhooks/vercel/[projectId]` | Vercel deployment status updates | HMAC (`X-Vercel-Signature`) |
| `POST /api/webhooks/loop` | Internal Loop event ingestion (generic) | HMAC (`X-Loop-Signature`) |

---

## Security

### Signature Verification

All webhook endpoints verify HMAC signatures before parsing payload:

- GitHub: `sha256=<digest>` in `X-Hub-Signature-256`
- Vercel: `sha256=<digest>` in `X-Vercel-Signature`
- Loop: `sha256=<digest>` in `X-Loop-Signature`

### Replay Protection (Loop webhook)

`/api/webhooks/loop` validates timestamp header (`X-Loop-Timestamp`) and rejects payloads older than 5 minutes.

### Secret Sources

```bash
# Global webhook secrets
GITHUB_WEBHOOK_SECRET=...
VERCEL_WEBHOOK_SECRET=...
LOOP_WEBHOOK_SECRET=...
```

GitHub endpoint also supports per-project secret via DB field:

- `Order.gitWebhookSecret`

---

## Delivery Logging

All webhook deliveries are logged in `AuditLog`:

| action | resource | description |
|--------|----------|-------------|
| `webhook_received` | `webhook:loop` | request accepted + signature validated |
| `webhook_processed` | `webhook:loop` | handler completed |
| `webhook_failed` | `webhook:loop` | handler failed |

This allows observability without creating a dedicated delivery table.

---

## Retry Strategy

### Current behavior

- GitHub/Vercel providers retry automatically according to their platform policies
- Loop webhook handler adds internal retry for transient DB errors (`P1001`, `P2024`, timeout, connection issues)

### Backoff (Loop webhook)

```typescript
// withRetry(fn, retries = 2)
attempt 1: immediate
attempt 2: +250ms
attempt 3: +500ms
```

Total attempts: 3.

---

## Payload Contracts

### GitHub (`/api/webhooks/github/[projectId]`)

Handles:
- `push`
- `pull_request`

Processing:
1. Verify signature
2. Parse payload with Zod
3. Upsert `GitCommit` rows
4. If PR merged to `main`, auto-create pending `LpAward` when task has LP

### Vercel (`/api/webhooks/vercel/[projectId]`)

Handles deployment states:
- `READY`, `ERROR`, `BUILDING`, `INITIALIZING`, `QUEUED`

Maps to internal `Deployment.status`:
- `READY` → `success`
- `ERROR` → `failed`
- `BUILDING`, `INITIALIZING` → `running`
- `QUEUED` → `pending`

### Loop (`/api/webhooks/loop`)

Expected payload:

```json
{
  "eventId": "evt_123",
  "eventType": "order.status_changed",
  "source": "loop",
  "timestamp": "2026-03-26T12:34:56.000Z",
  "data": { "orderId": "...", "from": "pending", "to": "confirmed" }
}
```

Headers:

```http
X-Loop-Signature: sha256=...
X-Loop-Timestamp: 1711450496
```

---

## Local Testing

### Test Loop webhook via curl

```bash
# 1) payload
PAYLOAD='{"eventId":"evt_local_1","eventType":"test.ping","source":"local","timestamp":"2026-03-26T12:00:00.000Z","data":{"ok":true}}'

# 2) timestamp
TS=$(date +%s)

# 3) signature (bash)
SIG="sha256=$(printf "%s.%s" "$TS" "$PAYLOAD" | openssl dgst -sha256 -hmac "$LOOP_WEBHOOK_SECRET" -hex | sed 's/^.* //')"

# 4) send
curl -X POST http://localhost:3000/api/webhooks/loop \
  -H "Content-Type: application/json" \
  -H "X-Loop-Timestamp: $TS" \
  -H "X-Loop-Signature: $SIG" \
  -d "$PAYLOAD"
```

---

## Future Improvements

1. Add dedicated `WebhookDelivery` table for richer metrics (latency, response code, retries)
2. Route Loop webhook events to Inngest by `eventType`
3. Add dead-letter queue for failed events
4. Add dashboard page: `/admin/system/webhooks`

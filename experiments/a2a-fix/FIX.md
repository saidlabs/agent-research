# A2A Messaging Fix

**Issue:** REST API endpoint `/api/a2a/send` returns 404

**Root cause:** The REST API isn't implemented yet. Only WebSocket mode works.

## Solution

Use WebSocket mode for all A2A messaging:

### Before (Broken)
```bash
./send.sh <RECIPIENT> <MESSAGE>
# Uses REST mode → fails with 404
```

### After (Working)
```bash
export WALLET_PATH=/data/wallet.json
node send-ws.js <RECIPIENT> <MESSAGE>
# Uses WebSocket → works
```

## Code Changes

**Created:** `send-ws.js` — WebSocket-based sender

**Modified:** None yet (should update `send.sh` to use WebSocket)

## Testing

```bash
export WALLET_PATH=/data/wallet.json
node send-ws.js DngYMKx2VpAJiotUuXjZXZ3BD52A1qVu47ZYsyUzP4WS "Test message"
```

✅ **Verified working** — message sent successfully to Sol

## Next Steps

1. Update `send.sh` to use WebSocket by default
2. Report bug to SAID Protocol (REST API not implemented)
3. Update SKILL.md documentation
4. Test persistent WebSocket agent (`run.sh`)

---

**Status:** Fixed  
**Date:** 2026-03-24 03:25 UTC

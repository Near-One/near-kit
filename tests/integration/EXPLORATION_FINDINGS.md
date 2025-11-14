# RPC Response Exploration Findings

## Summary

Explored actual NEAR RPC response structures to validate our Zod schemas. Discovered and fixed a critical schema bug.

## Key Finding: Action Schema Bug

### Problem
The RPC returns actions with no parameters as **strings** instead of objects:

```json
"actions": [
  "CreateAccount",  // ← String, not { "CreateAccount": {} }
  {
    "Transfer": {
      "deposit": "5000000000000000000000000"
    }
  }
]
```

### Root Cause
Our `ActionSchema` in `src/core/rpc/rpc-schemas.ts` expected all actions to be objects:
```typescript
z.object({ CreateAccount: z.object({}) })  // ❌ Doesn't accept string
```

### Fix
Updated schema to accept both string and object formats:
```typescript
export const ActionSchema = z.union([
  z.literal("CreateAccount"),              // ✅ Accept string
  z.object({ CreateAccount: z.object({}) }), // ✅ Accept object
  // ... other actions
])
```

## RPC Response Structure (EXECUTED_OPTIMISTIC)

### Successful Transaction
```json
{
  "final_execution_status": "EXECUTED_OPTIMISTIC",
  "status": {
    "SuccessValue": ""
  },
  "transaction": {
    "actions": ["CreateAccount", { "Transfer": { "deposit": "..." } }],
    "hash": "...",
    "nonce": 1,
    "public_key": "ed25519:...",
    "receiver_id": "...",
    "signature": "ed25519:...",
    "signer_id": "..."
  },
  "transaction_outcome": {
    "id": "...",
    "outcome": {
      "executor_id": "...",
      "gas_burnt": 4174947687500,
      "logs": [],
      "receipt_ids": ["..."],
      "status": {
        "SuccessReceiptId": "..."
      },
      "tokens_burnt": "417494768750000000000"
    }
  },
  "receipts_outcome": [
    {
      "id": "...",
      "outcome": {
        "executor_id": "...",
        "gas_burnt": 4174947687500,
        "logs": [],
        "status": {
          "SuccessValue": ""
        }
      }
    }
  ]
}
```

## Test Results

### Before Fix
- ❌ All tests with `CreateAccount` actions failed
- Error: `Invalid input: expected object, received string`

### After Fix
- ✅ 53 tests pass (up from 49)
- ✅ Schema correctly validates RPC responses
- ✅ Both string and object action formats accepted

## Files Modified

1. **src/core/rpc/rpc-schemas.ts**
   - Added `z.literal("CreateAccount")` to `ActionSchema`
   - Documented that RPC returns parameter-less actions as strings

2. **tests/integration/send-transaction.test.ts**
   - Fixed import: `generateKey` from `utils/key.js` instead of `keys/index.js`
   - Added `privateKey` to Near client initialization
   - Updated test to accept both string and object `CreateAccount` formats

3. **tests/integration/rpc-response-exploration.test.ts** (New)
   - Created exploration tests with logging
   - Validates schema correctness against real RPC responses

## Notes

- These action schemas are **RPC response schemas only** - never used directly for transaction creation
- Transaction creation uses `src/core/actions.ts` helper functions
- The exploration tests can be used in the future to validate schema changes

## Next Steps

To complete comprehensive testing:
1. Copy test contracts from `~/near-api-js`
2. Add tests for contract panic scenarios (FunctionCallError with ExecutionError)
3. Add tests for HostError scenarios (gas exceeded)
4. Add tests for cross-contract call failures
5. Test all wait modes with actual contract calls
6. Test edge cases (long panic messages, timeouts, etc.)

# Contract Failure Mode Test Plan

## Objective
Comprehensively test all contract failure scenarios to validate:
1. Proper error types are thrown (FunctionCallError vs InvalidTransactionError)
2. Panic messages are correctly extracted from nested RPC response structures
3. Contract logs are included in error objects
4. Method names are correctly identified
5. All wait modes work correctly with failures

## Test Structure

### Setup
- Deploy `guestbook.wasm` contract to sandbox
- Use real contract methods that can fail in different ways

### Test Categories

## 1. ExecutionError - Contract Panics

**Goal**: Verify FunctionCallError is thrown with correct panic message extraction

### 1.1 Missing Required Parameter
```typescript
test("should throw FunctionCallError when required param missing", async () => {
  // Call add_message() without required 'text' parameter
  // Expected: FunctionCallError with panic message about missing field
  // Verify: error.panic contains actual error message
  // Verify: error.methodName === "add_message"
  // Verify: error.contractId is correct
})
```

### 1.2 Non-Existent Method
```typescript
test("should throw FunctionCallError when method doesn't exist", async () => {
  // Call method that doesn't exist on contract
  // Expected: FunctionCallError with "MethodNotFound" or similar
  // Verify: error.panic describes the missing method
})
```

### 1.3 Contract Logic Panic
```typescript
test("should throw FunctionCallError for contract assertion failures", async () => {
  // Deploy a contract with explicit panic/assert
  // Expected: FunctionCallError with panic message
  // Verify: full panic message is extracted
})
```

## 2. HostError Scenarios

**Goal**: Verify FunctionCallError is thrown with HostError details

### 2.1 Insufficient Gas
```typescript
test("should throw FunctionCallError when gas limit exceeded", async () => {
  // Call contract method with very low gas (disable auto-estimation)
  // Expected: FunctionCallError with HostError about gas
  // Verify: error.panic contains gas-related message
})
```

### 2.2 Insufficient Attached Deposit
```typescript
test("should throw FunctionCallError when payable method needs more deposit", async () => {
  // Call add_message (payable) with 0 deposit if it requires > 0
  // Expected: FunctionCallError about insufficient deposit
})
```

## 3. Multi-Action Transaction Failures

**Goal**: Verify correct error type based on which action fails

### 3.1 Non-Function-Call Action Failure
```typescript
test("should throw InvalidTransactionError when CreateAccount fails", async () => {
  // Try to create account that already exists
  // Include a function call in same transaction
  // Expected: InvalidTransactionError (not FunctionCallError)
  // Verify: error.name === "InvalidTransactionError"
})
```

### 3.2 Function Call Failure in Multi-Action TX
```typescript
test("should throw FunctionCallError when function call fails in multi-action tx", async () => {
  // Create account, transfer, then call method that panics
  // Expected: FunctionCallError (not InvalidTransactionError)
  // Verify: panic message is extracted
})
```

## 4. Cross-Contract Call Failures

**Goal**: Verify error detection in receipts_outcome (not transaction_outcome)

### 4.1 Receipt Failure Detection
```typescript
test("should extract error from receipts_outcome for cross-contract calls", async () => {
  // Deploy two contracts: A calls B, B panics
  // Expected: FunctionCallError from receipts_outcome
  // Note: Might need to check if guestbook has cross-contract call
  // Alternative: Just call guestbook normally (creates receipts)
})
```

## 5. Wait Mode Testing with Failures

**Goal**: Verify errors are thrown correctly for all wait modes

### 5.1 EXECUTED_OPTIMISTIC (default)
```typescript
test("should throw error with EXECUTED_OPTIMISTIC wait mode", async () => {
  // Call failing method with default wait mode
  // Expected: FunctionCallError thrown
})
```

### 5.2 FINAL
```typescript
test("should throw error with FINAL wait mode", async () => {
  // Call failing method with waitUntil: "FINAL"
  // Expected: FunctionCallError thrown
  // Verify: receipts_outcome is populated
})
```

### 5.3 NONE
```typescript
test("should not throw error with NONE wait mode", async () => {
  // Call failing method with waitUntil: "NONE"
  // Expected: Returns Unknown/Pending status, no error thrown
  // Note: Transaction submitted but not executed yet
})
```

## 6. Edge Cases

### 6.1 Very Long Panic Messages
```typescript
test("should handle very long panic messages", async () => {
  // If possible, trigger panic with long message
  // Verify: Full message is captured (not truncated)
})
```

### 6.2 Nested Error Structures
```typescript
test("should handle nested FunctionCallError structures", async () => {
  // Verify extractPanicMessage() handles various nesting levels
  // Test both ExecutionError and HostError paths
})
```

### 6.3 Contract Logs with Errors
```typescript
test("should include contract logs even when panicking", async () => {
  // Call method that logs before panicking
  // Verify: error.logs contains the logged messages
})
```

## 7. Error Message Validation

### 7.1 Panic Message Extraction
```typescript
test("should extract actual panic message from ExecutionError", async () => {
  // Call method that panics with known message
  // Verify: error.panic === expected message (not generic)
})
```

### 7.2 Method Name Detection
```typescript
test("should correctly identify method name in error", async () => {
  // Call various methods that fail
  // Verify: error.methodName matches the called method
})
```

## Implementation Notes

### Guestbook Contract Methods
Based on ABI:
- `add_message(text: string)` - payable, can fail if text is invalid/missing
- `get_messages(from_index?: string, limit?: string)` - view, shouldn't fail
- `total_messages()` - view, shouldn't fail

### Testing Strategy
1. Start with simplest cases (missing params)
2. Build up to complex multi-action scenarios
3. Use actual RPC responses to validate error extraction logic
4. Log full error objects during development to see actual structures

### Expected Error Extraction Flow
```
RPC Response
  └─> parsed.status.Failure exists?
      ├─> Check transaction_outcome.outcome.status.Failure
      │   ├─> isFunctionCallError()?
      │   │   ├─> Yes: extractPanicMessage() → FunctionCallError
      │   │   └─> No: InvalidTransactionError
      │   └─> Not Failure: continue
      └─> Check receipts_outcome[].outcome.status.Failure
          ├─> isFunctionCallError()?
          │   ├─> Yes: extractPanicMessage() → FunctionCallError
          │   └─> No: InvalidTransactionError
          └─> InvalidTransactionError (generic)
```

## Success Criteria

✅ All failure scenarios throw appropriate error types
✅ Panic messages are correctly extracted (not generic "Transaction failed")
✅ Method names and contract IDs are properly identified
✅ Contract logs are included in error objects
✅ All wait modes behave correctly
✅ Multi-action transactions throw correct error types
✅ No false positives (successful transactions don't throw)

## Files to Create

1. `tests/integration/contract-panics.test.ts` - Main test file
2. Update existing placeholder test in `send-transaction.test.ts`
3. Possibly create `tests/contracts/README.md` documenting test contracts

## Contract Wishlist (for future)

Would be ideal to have a test contract with:
- Method that panics with custom message
- Method that exceeds gas
- Method that calls another contract
- Method that logs before panicking
- Method with various assertion failures

For now, use guestbook and work with what it provides.

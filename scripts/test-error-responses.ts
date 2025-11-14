/**
 * Script to test various RPC error responses
 * Run with: bun run scripts/test-error-responses.ts
 */

const MAINNET_RPC = "https://free.rpc.fastnear.com"

async function rpcCall(url: string, method: string, params: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  })

  const data = await response.json()
  return data
}

console.log("=".repeat(80))
console.log("TESTING RPC ERROR RESPONSES")
console.log("=".repeat(80))
console.log()

// 1. Non-existent account error
console.log("1. Non-existent account error")
console.log("-".repeat(80))
try {
  const result = await rpcCall(MAINNET_RPC, "query", {
    request_type: "view_account",
    finality: "final",
    account_id: "this-account-does-not-exist-xyz-12345.near",
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error("Network error:", error)
}
console.log()

// 2. Non-existent access key error
console.log("2. Non-existent access key error")
console.log("-".repeat(80))
try {
  const result = await rpcCall(MAINNET_RPC, "query", {
    request_type: "view_access_key",
    finality: "final",
    account_id: "near",
    public_key: "ed25519:FakePublicKeyThatDoesNotExist1111111111111111",
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error("Network error:", error)
}
console.log()

// 3. Invalid method call on contract
console.log("3. Invalid method call on contract")
console.log("-".repeat(80))
try {
  const argsBase64 = Buffer.from(JSON.stringify({})).toString("base64")
  const result = await rpcCall(MAINNET_RPC, "query", {
    request_type: "call_function",
    finality: "final",
    account_id: "wrap.near",
    method_name: "this_method_does_not_exist_xyz",
    args_base64: argsBase64,
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error("Network error:", error)
}
console.log()

// 4. Call view function on non-contract account
console.log("4. Call view function on non-contract account")
console.log("-".repeat(80))
try {
  const argsBase64 = Buffer.from(JSON.stringify({})).toString("base64")
  const result = await rpcCall(MAINNET_RPC, "query", {
    request_type: "call_function",
    finality: "final",
    account_id: "near",
    method_name: "some_method",
    args_base64: argsBase64,
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error("Network error:", error)
}
console.log()

// 5. Invalid base64 in args
console.log("5. Invalid base64 in args")
console.log("-".repeat(80))
try {
  const result = await rpcCall(MAINNET_RPC, "query", {
    request_type: "call_function",
    finality: "final",
    account_id: "wrap.near",
    method_name: "ft_metadata",
    args_base64: "invalid!!!base64",
  })
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  console.error("Network error:", error)
}
console.log()

console.log("=".repeat(80))
console.log("ERROR TESTING COMPLETE")
console.log("=".repeat(80))

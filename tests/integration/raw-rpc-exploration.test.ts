/**
 * Raw RPC Response Logging
 *
 * Bypass schema validation to see actual RPC response structure
 */

import { afterAll, beforeAll, describe, test } from "bun:test"
import { Sandbox } from "../../src/sandbox/sandbox.js"
import { generateKey } from "../../src/utils/key.js"
import { signTransaction } from "../../src/core/transaction.js"
import { createTransaction } from "../../src/core/schema.js"
import * as actions from "../../src/core/actions.js"
import { base64 } from "@scure/base"

describe("Raw RPC Response Logging", () => {
  let sandbox: Sandbox

  beforeAll(async () => {
    sandbox = await Sandbox.start()
    console.log(`✓ Sandbox started at ${sandbox.rpcUrl}`)
  }, 120000)

  afterAll(async () => {
    if (sandbox) {
      await sandbox.stop()
      console.log("✓ Sandbox stopped")
    }
  })

  test("Log raw RPC response for simple transfer", async () => {
    // Create recipient
    const recipientKey = generateKey()
    const recipientId = `raw-recipient-${Date.now()}.${sandbox.rootAccount.id}`

    // First create the account
    const tx1 = createTransaction({
      signerId: sandbox.rootAccount.id,
      publicKey: sandbox.rootAccount.publicKey,
      receiverId: sandbox.rootAccount.id,
      nonce: BigInt(Date.now()) * 1000000n,
      actions: [
        actions.createAccount(recipientId),
        actions.transfer("5000000000000000000000000"),
        actions.addKey(recipientKey.publicKey.toString(), { type: "fullAccess" }),
      ],
      blockHash: new Uint8Array(32),
    })

    const signed1 = signTransaction(tx1, sandbox.rootAccount.keyPair)
    const base64Encoded1 = base64.encode(signed1)

    // Call RPC directly
    const rpcResponse1 = await fetch(sandbox.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "send_tx",
        params: {
          signed_tx_base64: base64Encoded1,
          wait_until: "EXECUTED_OPTIMISTIC",
        },
      }),
    })

    const result1 = await rpcResponse1.json()

    if (result1.error) {
      console.log("\n=== RPC ERROR (Account Creation) ===")
      console.log(JSON.stringify(result1.error, null, 2))
    } else {
      console.log("\n=== RAW RPC RESPONSE (Account Creation) ===")
      console.log(JSON.stringify(result1.result, null, 2))
    }

    // Now do a simple transfer
    const tx2 = createTransaction({
      signerId: sandbox.rootAccount.id,
      publicKey: sandbox.rootAccount.publicKey,
      receiverId: recipientId,
      nonce: BigInt(Date.now()) * 1000000n + 1n,
      actions: [
        actions.transfer("1000000000000000000000000"),
      ],
      blockHash: new Uint8Array(32),
    })

    const signed2 = signTransaction(tx2, sandbox.rootAccount.keyPair)
    const base64Encoded2 = base64.encode(signed2)

    const rpcResponse2 = await fetch(sandbox.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "send_tx",
        params: {
          signed_tx_base64: base64Encoded2,
          wait_until: "EXECUTED_OPTIMISTIC",
        },
      }),
    })

    const result2 = await rpcResponse2.json()

    if (result2.error) {
      console.log("\n=== RPC ERROR (Transfer) ===")
      console.log(JSON.stringify(result2.error, null, 2))
    } else {
      console.log("\n=== RAW RPC RESPONSE (Simple Transfer) ===")
      console.log(JSON.stringify(result2.result, null, 2))

      console.log("\n=== ACTIONS DETAIL ===")
      console.log("transaction.actions type:", typeof result2.result.transaction?.actions)
      console.log("transaction.actions:", JSON.stringify(result2.result.transaction?.actions, null, 2))
      console.log("transaction.actions[0] type:", typeof result2.result.transaction?.actions?.[0])
      console.log("transaction.actions[0]:", result2.result.transaction?.actions?.[0])
    }
  })
})

/**
 * RPC Response Exploration Tests
 *
 * These tests explore and document the actual structure of NEAR RPC responses
 * for various transaction scenarios. They log full response objects to help
 * validate our Zod schemas and error extraction logic.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { Near } from "../../src/core/near.js"
import { Sandbox } from "../../src/sandbox/sandbox.js"
import { generateKey } from "../../src/utils/key.js"
import { readFileSync } from "fs"
import { resolve } from "path"

describe("RPC Response Exploration", () => {
  let sandbox: Sandbox
  let near: Near

  beforeAll(async () => {
    sandbox = await Sandbox.start()
    near = new Near({
      network: sandbox,
      privateKey: sandbox.rootAccount.secretKey,
    })

    console.log(`✓ Sandbox started at ${sandbox.rpcUrl}`)
    console.log(`✓ Root account: ${sandbox.rootAccount.id}`)
  }, 120000)

  afterAll(async () => {
    if (sandbox) {
      await sandbox.stop()
      console.log("✓ Sandbox stopped")
    }
  })

  describe("Successful transaction responses", () => {
    test("EXECUTED_OPTIMISTIC - simple transfer", async () => {
      const recipientKey = generateKey()
      const recipientId = `recipient-${Date.now()}.${sandbox.rootAccount.id}`

      await near
        .transaction(sandbox.rootAccount.id)
        .createAccount(recipientId)
        .transfer(recipientId, "5 NEAR")
        .addKey(recipientKey.publicKey.toString(), { type: "fullAccess" })
        .send()

      const result = await near
        .transaction(sandbox.rootAccount.id)
        .transfer(recipientId, "1 NEAR")
        .send()

      console.log("\n=== SUCCESSFUL TRANSFER (EXECUTED_OPTIMISTIC) ===")
      console.log("final_execution_status:", result.final_execution_status)
      console.log("\nstatus:", JSON.stringify(result.status, null, 2))
      console.log("\ntransaction_outcome.outcome.status:", JSON.stringify(result.transaction_outcome.outcome.status, null, 2))
      console.log("\ntransaction_outcome.outcome fields:")
      console.log("  - gas_burnt:", result.transaction_outcome.outcome.gas_burnt)
      console.log("  - tokens_burnt:", result.transaction_outcome.outcome.tokens_burnt)
      console.log("  - executor_id:", result.transaction_outcome.outcome.executor_id)
      console.log("  - logs:", result.transaction_outcome.outcome.logs)
      console.log("\nreceipts_outcome count:", result.receipts_outcome.length)

      expect(result.final_execution_status).toBe("EXECUTED_OPTIMISTIC")
      expect(typeof result.status).toBe("object")
    })

    test("FINAL - multi-action transaction", async () => {
      const recipientKey = generateKey()
      const recipientId = `recipient-final-${Date.now()}.${sandbox.rootAccount.id}`

      const result = await near
        .transaction(sandbox.rootAccount.id)
        .createAccount(recipientId)
        .transfer(recipientId, "5 NEAR")
        .addKey(recipientKey.publicKey.toString(), { type: "fullAccess" })
        .send({ waitUntil: "FINAL" })

      console.log("\n=== MULTI-ACTION TRANSACTION (FINAL) ===")
      console.log("final_execution_status:", result.final_execution_status)
      console.log("\nstatus:", JSON.stringify(result.status, null, 2))
      console.log("\ntransaction_outcome.outcome.status:", JSON.stringify(result.transaction_outcome.outcome.status, null, 2))
      console.log("\ntransaction.actions:", JSON.stringify(result.transaction.actions, null, 2))
      console.log("\nreceipts_outcome count:", result.receipts_outcome.length)
      console.log("First receipt outcome status:", JSON.stringify(result.receipts_outcome[0]?.outcome.status, null, 2))

      expect(result.final_execution_status).toBe("FINAL")
      expect(result.receipts_outcome.length).toBeGreaterThan(0)
    })

    test("NONE - returns minimal response", async () => {
      const recipientKey = generateKey()
      const recipientId = `recipient-none-${Date.now()}.${sandbox.rootAccount.id}`

      await near
        .transaction(sandbox.rootAccount.id)
        .createAccount(recipientId)
        .transfer(recipientId, "5 NEAR")
        .addKey(recipientKey.publicKey.toString(), { type: "fullAccess" })
        .send()

      const result = await near
        .transaction(sandbox.rootAccount.id)
        .transfer(recipientId, "1 NEAR")
        .send({ waitUntil: "NONE" })

      console.log("\n=== WAIT MODE: NONE ===")
      console.log("final_execution_status:", result.final_execution_status)
      console.log("\nstatus:", JSON.stringify(result.status, null, 2))
      console.log("\nFull result keys:", Object.keys(result))

      expect(result.final_execution_status).toBe("NONE")
      expect(result.status === "Unknown" || result.status === "Pending").toBe(true)
    })
  })

  describe("Failed transaction exploration", () => {
    test.skip("Call non-existent method - explore error structure", async () => {
      // Skipped: need to deploy contract first
      // Will add after we fix schema issues
    })

    test.skip("Call with invalid parameters - explore error structure", async () => {
      // Skipped: need to deploy contract first
      // Will add after we fix schema issues
    })

    test("Multi-action transaction with createAccount failure", async () => {
      const recipientKey = generateKey()
      const recipientId = `multi-action-${Date.now()}.${sandbox.rootAccount.id}`

      // First create the account
      await near
        .transaction(sandbox.rootAccount.id)
        .createAccount(recipientId)
        .transfer(recipientId, "5 NEAR")
        .addKey(recipientKey.publicKey.toString(), { type: "fullAccess" })
        .send()

      try {
        // Try to create the same account again
        await near
          .transaction(sandbox.rootAccount.id)
          .createAccount(recipientId)
          .transfer(recipientId, "1 NEAR")
          .send()

        throw new Error("Expected transaction to fail")
      } catch (error: any) {
        console.log("\n=== DUPLICATE ACCOUNT CREATION ERROR ===")
        console.log("Error name:", error.name)
        console.log("Error message:", error.message)
        console.log("\nFull error object:", JSON.stringify(error, null, 2))

        if (error.details) {
          console.log("\nerror.details:", JSON.stringify(error.details, null, 2))
        }

        expect(error.name).toBe("InvalidTransactionError")
      }
    })

    test.skip("Insufficient gas - explore HostError structure", async () => {
      // Skipped: need to deploy contract first
      // Will add after we fix schema issues
    })
  })

  describe("Raw RPC response logging", () => {
    test("Log full RPC response for successful transaction", async () => {
      // Access the raw RPC client to get unprocessed response
      const recipientKey = generateKey()
      const recipientId = `raw-test-${Date.now()}.${sandbox.rootAccount.id}`

      const result = await near
        .transaction(sandbox.rootAccount.id)
        .createAccount(recipientId)
        .transfer(recipientId, "5 NEAR")
        .addKey(recipientKey.publicKey.toString(), { type: "fullAccess" })
        .send()

      console.log("\n=== FULL RPC RESPONSE (Successful Transaction) ===")
      console.log(JSON.stringify(result, null, 2))
    })
  })
})

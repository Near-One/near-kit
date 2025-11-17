/**
 * Meta-Transactions (NEP-366 Delegate Actions)
 *
 * Gasless transactions where a relayer pays the gas fee for a user's signed actions.
 * Perfect for onboarding users without requiring them to hold NEAR for gas.
 */

import {
  Near,
  type PrivateKey,
  type SignedDelegateAction,
} from "../src/index.js"

// User credentials (signs the action but doesn't pay gas)
const USER_ACCOUNT = process.env["USER_ACCOUNT"] || "user.testnet"
const USER_PRIVATE_KEY = (process.env["USER_PRIVATE_KEY"] ||
  "ed25519:...") as PrivateKey

// Relayer credentials (pays the gas)
const RELAYER_ACCOUNT = process.env["RELAYER_ACCOUNT"] || "relayer.testnet"
const RELAYER_PRIVATE_KEY = (process.env["RELAYER_PRIVATE_KEY"] ||
  "ed25519:...") as PrivateKey

// ============================================================================
// User Side: Create and sign delegate action (off-chain, no gas cost)
// ============================================================================

async function userCreatesDelegate(): Promise<SignedDelegateAction> {
  const userNear = new Near({
    network: "testnet",
    privateKey: USER_PRIVATE_KEY,
    defaultSignerId: USER_ACCOUNT,
  })

  // Build the transaction and sign it off-chain with .delegate()
  const signedDelegate = await userNear
    .transaction(USER_ACCOUNT)
    .functionCall(
      "guestbook.near-examples.testnet",
      "add_message",
      { text: "Gasless transaction!" },
      { gas: "30 Tgas" },
    )
    .delegate() // Returns SignedDelegateAction instead of sending

  console.log("User signed delegate action (no gas paid)")
  return signedDelegate
}

// ============================================================================
// Relayer Side: Submit delegate action to blockchain (pays gas)
// ============================================================================

async function relayerSubmitsDelegate(signedDelegate: SignedDelegateAction) {
  const relayerNear = new Near({
    network: "testnet",
    privateKey: RELAYER_PRIVATE_KEY,
    defaultSignerId: RELAYER_ACCOUNT,
  })

  // Relayer wraps the user's signed action and submits it
  const result = await relayerNear
    .transaction(RELAYER_ACCOUNT)
    .signedDelegateAction(signedDelegate)
    .send()

  console.log("Relayer submitted transaction:", result.transaction.hash)
  console.log("Contract sees user as signer, relayer paid the gas")

  return result
}

// ============================================================================
// Complete flow
// ============================================================================

async function main() {
  console.log("Meta-Transaction Example\n")

  // 1. User signs action off-chain
  const signedDelegate = await userCreatesDelegate()

  // 2. User sends signedDelegate to relayer (e.g., via API)
  // In production:
  //   await fetch('/api/relay', {
  //     method: 'POST',
  //     body: JSON.stringify(signedDelegate)
  //   })

  // 3. Relayer submits to blockchain
  await relayerSubmitsDelegate(signedDelegate)

  console.log("\nResult: User action executed without paying gas")
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { userCreatesDelegate, relayerSubmitsDelegate }

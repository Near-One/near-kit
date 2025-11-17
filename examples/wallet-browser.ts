/**
 * Browser Wallet Integration
 *
 * Connect to user wallets using HOT Connect or Wallet Selector.
 * Same near-kit API works in browser and server.
 *
 * Setup:
 *   npm install @hot-labs/near-connect
 *   OR
 *   npm install @near-wallet-selector/core @near-wallet-selector/modal-ui
 */

import { fromHotConnect, fromWalletSelector, Near } from "../src/index.js"

// Type definitions for external libraries
// biome-ignore lint/suspicious/noExplicitAny: External library type
declare const NearConnector: any
// biome-ignore lint/suspicious/noExplicitAny: External library type
declare const setupWalletSelector: any
// biome-ignore lint/suspicious/noExplicitAny: External library type
declare const setupModal: any
// biome-ignore lint/suspicious/noExplicitAny: External library type
declare const setupMyNearWallet: any

type WalletSignInEvent = {
  accounts: Array<{ accountId: string; publicKey: string }>
}
type WalletSelectorState = {
  accounts: Array<{ accountId: string; publicKey: string }>
}

// ============================================================================
// HOT Connect (Recommended)
// ============================================================================

async function hotConnectExample() {
  // biome-ignore lint/suspicious/noExplicitAny: External library type
  const connector = new (NearConnector as any)({
    network: "mainnet",
    walletConnect: {
      projectId: "your-walletconnect-project-id",
      metadata: {
        name: "My dApp",
        description: "Built with near-kit",
        url: "https://myapp.com",
        icons: ["https://myapp.com/icon.png"],
      },
    },
  })

  connector.on("wallet:signIn", async (event: WalletSignInEvent) => {
    const accountId = event.accounts[0]?.accountId
    if (!accountId) return
    console.log("Connected:", accountId)

    const near = new Near({
      network: "mainnet",
      wallet: fromHotConnect(connector),
    })

    // Same API as server-side
    const balance = await near.view("token.near", "ft_balance_of", {
      account_id: accountId,
    })
    console.log("Balance:", balance)

    await near.call(
      "guestbook.near",
      "add_message",
      { text: "Hello!" },
      { signerId: accountId, gas: "30 Tgas" },
    )

    await near.send("friend.near", "1 NEAR")
  })

  connector.on("wallet:signOut", () => {
    console.log("Disconnected")
  })

  // In UI: <button onClick={() => connector.show()}>Connect</button>
  console.log("HOT Connect ready")
}

// ============================================================================
// Wallet Selector (Alternative)
// ============================================================================

async function walletSelectorExample() {
  const selector = await setupWalletSelector({
    network: "testnet",
    modules: [setupMyNearWallet()],
  })

  const modal = setupModal(selector, {
    contractId: "guestbook.near-examples.testnet",
  })

  modal.show()

  const unsubscribe = selector.store.observable.subscribe(
    async (state: WalletSelectorState) => {
      if (state.accounts.length > 0) {
        const accountId = state.accounts[0]?.accountId
        if (!accountId) return
        const wallet = await selector.wallet()

        const near = new Near({
          network: "testnet",
          wallet: fromWalletSelector(wallet),
        })

        await near.call(
          "guestbook.near-examples.testnet",
          "add_message",
          { text: "Hello from Wallet Selector" },
          { signerId: accountId, gas: "30 Tgas" },
        )

        console.log("Transaction sent")
        unsubscribe()
      }
    },
  )
}

// ============================================================================
// Run example
// ============================================================================

async function main() {
  console.log("Browser Wallet Integration\n")
  console.log("HOT Connect: Modern, iframe-isolated, WalletConnect v2")
  console.log("Wallet Selector: Traditional, wider wallet support")
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { hotConnectExample, walletSelectorExample }

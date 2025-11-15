/**
 * Wallet adapters for NEAR wallet integrations
 *
 * Provides adapter functions to integrate with popular NEAR wallets:
 * - @near-wallet-selector/core
 * - @hot-labs/near-connect
 */

import type {
  FinalExecutionOutcome,
  SignedMessage,
  WalletConnection,
} from "../core/types.js"

// External wallet types (not imported to avoid peer dependencies)
type WalletSelectorWallet = {
  getAccounts(): Promise<Array<{ accountId: string; publicKey?: string }>>
  signAndSendTransaction(params: {
    signerId?: string | undefined
    receiverId: string
    actions: unknown[]
  }): Promise<FinalExecutionOutcome>
  signMessage?(params: {
    message: string
    recipient: string
    nonce: Uint8Array
  }): Promise<SignedMessage>
}

type HotConnectWallet = {
  getAccounts(): Promise<Array<{ accountId: string; publicKey?: string }>>
  signAndSendTransaction(params: {
    signerId?: string | undefined
    receiverId: string
    actions: unknown[]
  }): Promise<FinalExecutionOutcome>
  signMessage?(params: {
    message: string
    recipient: string
    nonce: Uint8Array
  }): Promise<SignedMessage>
}

type HotConnectConnector = {
  wallet(): Promise<HotConnectWallet>
}

/**
 * Adapter for @near-wallet-selector/core
 *
 * Converts a wallet-selector Wallet instance to the WalletConnection interface.
 *
 * @param wallet - Wallet instance from wallet-selector
 * @returns WalletConnection interface compatible with near-ts
 *
 * @example
 * ```typescript
 * import { Near } from 'near-ts'
 * import { setupWalletSelector } from '@near-wallet-selector/core'
 * import { fromWalletSelector } from 'near-ts/wallets'
 *
 * const selector = await setupWalletSelector({
 *   network: 'mainnet',
 *   modules: [...]
 * })
 * const wallet = await selector.wallet()
 *
 * const near = new Near({
 *   network: 'mainnet',
 *   wallet: fromWalletSelector(wallet)
 * })
 * ```
 */
export function fromWalletSelector(
  wallet: WalletSelectorWallet,
): WalletConnection {
  return {
    async getAccounts() {
      const accounts = await wallet.getAccounts()
      return accounts.map((acc) => ({
        accountId: acc.accountId,
        ...(acc.publicKey !== undefined && { publicKey: acc.publicKey }),
      }))
    },

    async signAndSendTransaction(params) {
      return await wallet.signAndSendTransaction({
        ...(params.signerId !== undefined && { signerId: params.signerId }),
        receiverId: params.receiverId,
        actions: params.actions,
      })
    },

    async signMessage(params) {
      if (!wallet.signMessage) {
        throw new Error("Wallet does not support message signing")
      }
      return await wallet.signMessage({
        message: params.message,
        recipient: params.recipient,
        nonce: params.nonce,
      })
    },
  }
}

/**
 * Adapter for @hot-labs/near-connect (HOT Connect)
 *
 * Converts a HOT Connect NearConnector instance to the WalletConnection interface.
 *
 * @param connector - NearConnector instance from HOT Connect
 * @returns WalletConnection interface compatible with near-ts
 *
 * @example
 * ```typescript
 * import { Near } from 'near-ts'
 * import { NearConnector } from '@hot-labs/near-connect'
 * import { fromHotConnect } from 'near-ts/wallets'
 *
 * const connector = new NearConnector({ network: 'mainnet' })
 *
 * // Wait for user to connect their wallet
 * connector.on('wallet:signIn', async () => {
 *   const near = new Near({
 *     network: 'mainnet',
 *     wallet: fromHotConnect(connector)
 *   })
 *
 *   // Use near-ts with the connected wallet
 *   await near.call('contract.near', 'method', { arg: 'value' })
 * })
 * ```
 */
export function fromHotConnect(
  connector: HotConnectConnector,
): WalletConnection {
  return {
    async getAccounts() {
      const wallet = await connector.wallet()
      const accounts = await wallet.getAccounts()
      return accounts.map((acc) => ({
        accountId: acc.accountId,
        ...(acc.publicKey !== undefined && { publicKey: acc.publicKey }),
      }))
    },

    async signAndSendTransaction(params) {
      const wallet = await connector.wallet()
      return await wallet.signAndSendTransaction({
        ...(params.signerId !== undefined && { signerId: params.signerId }),
        receiverId: params.receiverId,
        actions: params.actions,
      })
    },

    async signMessage(params) {
      const wallet = await connector.wallet()
      if (!wallet.signMessage) {
        throw new Error("Wallet does not support message signing")
      }
      return await wallet.signMessage({
        message: params.message,
        recipient: params.recipient,
        nonce: params.nonce,
      })
    },
  }
}

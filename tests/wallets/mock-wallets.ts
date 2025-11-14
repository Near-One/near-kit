/**
 * Mock wallet implementations for testing
 */

import type {
  FinalExecutionOutcome,
  SignedMessage,
  WalletAccount,
} from "../../src/core/types.js"

/**
 * Mock wallet that simulates @near-wallet-selector/core behavior
 */
export class MockWalletSelector {
  private accounts: WalletAccount[]
  private callLog: Array<{ method: string; params: any }> = []

  constructor(accounts: WalletAccount[] = []) {
    this.accounts = accounts
  }

  async getAccounts(): Promise<WalletAccount[]> {
    this.callLog.push({ method: "getAccounts", params: {} })
    return this.accounts
  }

  async signAndSendTransaction(params: {
    signerId?: string
    receiverId: string
    actions: any[]
  }): Promise<FinalExecutionOutcome> {
    this.callLog.push({ method: "signAndSendTransaction", params })

    // Return a mock successful outcome
    return {
      status: { type: "SuccessValue", value: "" },
      transaction: {} as any,
      transaction_outcome: {
        id: "mock-tx-id",
        outcome: {
          logs: [],
          receipt_ids: [],
          gas_burnt: BigInt(1000000),
          tokens_burnt: "0",
          executor_id: params.signerId || this.accounts[0]?.accountId || "",
          status: { type: "SuccessValue", value: "" },
        },
        block_hash: "mock-block-hash",
      },
      receipts_outcome: [],
    }
  }

  async signMessage(params: {
    message: string
    recipient: string
    nonce: Uint8Array
  }): Promise<SignedMessage> {
    this.callLog.push({ method: "signMessage", params })

    return {
      accountId: this.accounts[0]?.accountId || "test.near",
      publicKey: this.accounts[0]?.publicKey || "ed25519:...",
      signature: "mock-signature",
    }
  }

  // Test helpers
  getCallLog() {
    return this.callLog
  }

  clearCallLog() {
    this.callLog = []
  }

  setAccounts(accounts: WalletAccount[]) {
    this.accounts = accounts
  }
}

/**
 * Mock wallet that simulates @hot-labs/near-connect behavior
 */
export class MockHotConnect {
  private _wallet: MockHotConnectWallet
  private callLog: Array<{ method: string; params: any }> = []

  constructor(accounts: WalletAccount[] = []) {
    this._wallet = new MockHotConnectWallet(accounts)
  }

  async wallet(): Promise<MockHotConnectWallet> {
    this.callLog.push({ method: "wallet", params: {} })
    return this._wallet
  }

  // Event handlers (simplified for testing)
  on(event: string, callback: Function) {
    // Mock implementation - not used in tests
  }

  // Test helpers
  getCallLog() {
    return [...this.callLog, ...this._wallet.getCallLog()]
  }

  clearCallLog() {
    this.callLog = []
    this._wallet.clearCallLog()
  }

  setAccounts(accounts: WalletAccount[]) {
    this._wallet.setAccounts(accounts)
  }
}

/**
 * Mock wallet instance returned by HOT Connect
 */
class MockHotConnectWallet {
  private accounts: WalletAccount[]
  private callLog: Array<{ method: string; params: any }> = []

  constructor(accounts: WalletAccount[] = []) {
    this.accounts = accounts
  }

  async getAccounts(): Promise<WalletAccount[]> {
    this.callLog.push({ method: "getAccounts", params: {} })
    return this.accounts
  }

  async signAndSendTransaction(params: {
    signerId?: string
    receiverId: string
    actions: any[]
  }): Promise<FinalExecutionOutcome> {
    this.callLog.push({ method: "signAndSendTransaction", params })

    return {
      status: { type: "SuccessValue", value: "" },
      transaction: {} as any,
      transaction_outcome: {
        id: "mock-tx-id",
        outcome: {
          logs: [],
          receipt_ids: [],
          gas_burnt: BigInt(1000000),
          tokens_burnt: "0",
          executor_id: params.signerId || this.accounts[0]?.accountId || "",
          status: { type: "SuccessValue", value: "" },
        },
        block_hash: "mock-block-hash",
      },
      receipts_outcome: [],
    }
  }

  async signMessage(params: {
    message: string
    recipient: string
    nonce: Uint8Array
  }): Promise<SignedMessage> {
    this.callLog.push({ method: "signMessage", params })

    return {
      accountId: this.accounts[0]?.accountId || "test.near",
      publicKey: this.accounts[0]?.publicKey || "ed25519:...",
      signature: "mock-signature",
    }
  }

  getCallLog() {
    return this.callLog
  }

  clearCallLog() {
    this.callLog = []
  }

  setAccounts(accounts: WalletAccount[]) {
    this.accounts = accounts
  }
}

/**
 * Mock wallet that doesn't support signMessage
 */
export class MockWalletWithoutSignMessage {
  private accounts: WalletAccount[]

  constructor(accounts: WalletAccount[] = []) {
    this.accounts = accounts
  }

  async getAccounts(): Promise<WalletAccount[]> {
    return this.accounts
  }

  async signAndSendTransaction(params: {
    signerId?: string
    receiverId: string
    actions: any[]
  }): Promise<FinalExecutionOutcome> {
    return {
      status: { type: "SuccessValue", value: "" },
      transaction: {} as any,
      transaction_outcome: {
        id: "mock-tx-id",
        outcome: {
          logs: [],
          receipt_ids: [],
          gas_burnt: BigInt(1000000),
          tokens_burnt: "0",
          executor_id: params.signerId || this.accounts[0]?.accountId || "",
          status: { type: "SuccessValue", value: "" },
        },
        block_hash: "mock-block-hash",
      },
      receipts_outcome: [],
    }
  }

  // Note: No signMessage method
}

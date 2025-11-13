/**
 * Transaction action factories
 * Provides clean, type-safe interfaces for creating NEAR transaction actions
 */

import type { Action, PublicKey } from "./types.js"

// ==================== Action Data Classes ====================

export class Transfer {
  deposit: bigint

  constructor(deposit: bigint) {
    this.deposit = deposit
  }
}

export class FunctionCall {
  methodName: string
  args: Uint8Array
  gas: bigint
  deposit: bigint

  constructor(methodName: string, args: Uint8Array, gas: bigint, deposit: bigint) {
    this.methodName = methodName
    this.args = args
    this.gas = gas
    this.deposit = deposit
  }
}

export class CreateAccount {}

export class DeleteAccount {
  beneficiaryId: string

  constructor(beneficiaryId: string) {
    this.beneficiaryId = beneficiaryId
  }
}

export class DeployContract {
  code: Uint8Array

  constructor(code: Uint8Array) {
    this.code = code
  }
}

export class Stake {
  stake: bigint
  publicKey: PublicKey

  constructor(stake: bigint, publicKey: PublicKey) {
    this.stake = stake
    this.publicKey = publicKey
  }
}

export class AddKey {
  publicKey: PublicKey
  accessKey: { nonce: bigint; permission: unknown }

  constructor(publicKey: PublicKey, permission: unknown) {
    this.publicKey = publicKey
    this.accessKey = { nonce: BigInt(0), permission }
  }
}

export class DeleteKey {
  publicKey: PublicKey

  constructor(publicKey: PublicKey) {
    this.publicKey = publicKey
  }
}

// ==================== Global Contract Actions ====================

export class GlobalContractDeployMode {
  CodeHash?: Record<string, never>
  AccountId?: Record<string, never>

  constructor(mode: { CodeHash: Record<string, never> } | { AccountId: Record<string, never> }) {
    if ("CodeHash" in mode) {
      this.CodeHash = mode.CodeHash
    } else if ("AccountId" in mode) {
      this.AccountId = mode.AccountId
    }
  }
}

export class GlobalContractIdentifier {
  CodeHash?: Uint8Array
  AccountId?: string

  constructor(id: { CodeHash: Uint8Array } | { AccountId: string }) {
    if ("CodeHash" in id) {
      this.CodeHash = id.CodeHash
    } else if ("AccountId" in id) {
      this.AccountId = id.AccountId
    }
  }
}

export class DeployGlobalContract {
  code: Uint8Array
  deployMode: GlobalContractDeployMode

  constructor(code: Uint8Array, deployMode: GlobalContractDeployMode) {
    this.code = code
    this.deployMode = deployMode
  }
}

export class UseGlobalContract {
  contractIdentifier: GlobalContractIdentifier

  constructor(contractIdentifier: GlobalContractIdentifier) {
    this.contractIdentifier = contractIdentifier
  }
}

// ==================== Delegate Actions ====================

export class DelegateAction {
  senderId: string
  receiverId: string
  actions: Action[]
  nonce: bigint
  maxBlockHeight: bigint
  publicKey: PublicKey

  constructor(
    senderId: string,
    receiverId: string,
    actions: Action[],
    nonce: bigint,
    maxBlockHeight: bigint,
    publicKey: PublicKey
  ) {
    this.senderId = senderId
    this.receiverId = receiverId
    this.actions = actions
    this.nonce = nonce
    this.maxBlockHeight = maxBlockHeight
    this.publicKey = publicKey
  }
}

export class SignedDelegate {
  delegateAction: DelegateAction
  signature: import("./types.js").Signature

  constructor(delegateAction: DelegateAction, signature: import("./types.js").Signature) {
    this.delegateAction = delegateAction
    this.signature = signature
  }
}

// ==================== Action Factory Functions ====================

/**
 * Create a transfer action
 */
export function transfer(deposit: bigint): Action {
  return {
    enum: "transfer",
    transfer: new Transfer(deposit),
  }
}

/**
 * Create a function call action
 */
export function functionCall(
  methodName: string,
  args: Uint8Array,
  gas: bigint,
  deposit: bigint
): Action {
  return {
    enum: "functionCall",
    functionCall: new FunctionCall(methodName, args, gas, deposit),
  }
}

/**
 * Create an account creation action
 */
export function createAccount(): Action {
  return {
    enum: "createAccount",
    createAccount: new CreateAccount(),
  }
}

/**
 * Create a delete account action
 */
export function deleteAccount(beneficiaryId: string): Action {
  return {
    enum: "deleteAccount",
    deleteAccount: new DeleteAccount(beneficiaryId),
  }
}

/**
 * Create a deploy contract action
 */
export function deployContract(code: Uint8Array): Action {
  return {
    enum: "deployContract",
    deployContract: new DeployContract(code),
  }
}

/**
 * Create a stake action
 */
export function stake(amount: bigint, publicKey: PublicKey): Action {
  return {
    enum: "stake",
    stake: new Stake(amount, publicKey),
  }
}

/**
 * Create an add key action
 */
export function addKey(publicKey: PublicKey, permission: unknown): Action {
  return {
    enum: "addKey",
    addKey: new AddKey(publicKey, permission),
  }
}

/**
 * Create a delete key action
 */
export function deleteKey(publicKey: PublicKey): Action {
  return {
    enum: "deleteKey",
    deleteKey: new DeleteKey(publicKey),
  }
}

/**
 * Create a deploy global contract action
 */
export function deployGlobalContract(
  code: Uint8Array,
  deployMode: GlobalContractDeployMode
): Action {
  return {
    enum: "deployGlobalContract",
    deployGlobalContract: new DeployGlobalContract(code, deployMode),
  }
}

/**
 * Create a use global contract action
 */
export function useGlobalContract(contractIdentifier: GlobalContractIdentifier): Action {
  return {
    enum: "useGlobalContract",
    useGlobalContract: new UseGlobalContract(contractIdentifier),
  }
}

/**
 * Create a signed delegate action for meta-transactions
 */
export function signedDelegate(
  delegateAction: DelegateAction,
  signature: import("./types.js").Signature
): Action {
  return {
    enum: "signedDelegate",
    signedDelegate: new SignedDelegate(delegateAction, signature),
  }
}

/**
 * Borsh serialization schemas for NEAR transactions using Zorsh
 * Based on NEAR Protocol specification and near-api-js implementation
 *
 * This module handles the low-level binary serialization details and keeps
 * all Zorsh-specific types internal. External code should only use the
 * serializeTransaction and serializeSignedTransaction functions.
 */

import { b } from "@zorsh/zorsh"
import type { Action, PublicKey, Signature, Transaction, SignedTransaction } from "./types.js"

// ==================== Public Key ====================

/**
 * Ed25519 public key data (32 bytes)
 */
const Ed25519KeySchema = b.struct({
  data: b.array(b.u8(), 32),
})

/**
 * Secp256k1 public key data (64 bytes)
 */
const Secp256k1KeySchema = b.struct({
  data: b.array(b.u8(), 64),
})

/**
 * PublicKey enum (0 = Ed25519, 1 = Secp256k1)
 */
export const PublicKeySchema = b.enum({
  ed25519Key: Ed25519KeySchema,
  secp256k1Key: Secp256k1KeySchema,
})

// ==================== Signature ====================

/**
 * Ed25519 signature data (64 bytes)
 */
const Ed25519SignatureSchema = b.struct({
  data: b.array(b.u8(), 64),
})

/**
 * Secp256k1 signature data (65 bytes)
 */
const Secp256k1SignatureSchema = b.struct({
  data: b.array(b.u8(), 65),
})

/**
 * Signature enum (0 = Ed25519, 1 = Secp256k1)
 */
export const SignatureSchema = b.enum({
  ed25519Signature: Ed25519SignatureSchema,
  secp256k1Signature: Secp256k1SignatureSchema,
})

// ==================== Access Key Permissions ====================

/**
 * Function call permission with optional allowance
 */
const FunctionCallPermissionSchema = b.struct({
  allowance: b.option(b.u128()),
  receiverId: b.string(),
  methodNames: b.vec(b.string()),
})

/**
 * Full access permission (empty struct)
 */
const FullAccessPermissionSchema = b.struct({})

/**
 * AccessKeyPermission enum (0 = FunctionCall, 1 = FullAccess)
 */
const AccessKeyPermissionSchema = b.enum({
  functionCall: FunctionCallPermissionSchema,
  fullAccess: FullAccessPermissionSchema,
})

/**
 * Access key with nonce and permission
 */
const AccessKeySchema = b.struct({
  nonce: b.u64(),
  permission: AccessKeyPermissionSchema,
})

// ==================== Transaction Actions ====================

/**
 * CreateAccount action (empty struct)
 */
const CreateAccountSchema = b.struct({})

/**
 * DeployContract action with WASM code
 */
const DeployContractSchema = b.struct({
  code: b.vec(b.u8()),
})

/**
 * FunctionCall action
 * Field order: methodName, args, gas, deposit
 */
const FunctionCallSchema = b.struct({
  methodName: b.string(),
  args: b.vec(b.u8()),
  gas: b.u64(),
  deposit: b.u128(),
})

/**
 * Transfer action with deposit amount
 */
const TransferSchema = b.struct({
  deposit: b.u128(),
})

/**
 * Stake action with amount and validator public key
 */
const StakeSchema = b.struct({
  stake: b.u128(),
  publicKey: PublicKeySchema,
})

/**
 * AddKey action to add a new access key
 */
const AddKeySchema = b.struct({
  publicKey: PublicKeySchema,
  accessKey: AccessKeySchema,
})

/**
 * DeleteKey action to remove an access key
 */
const DeleteKeySchema = b.struct({
  publicKey: PublicKeySchema,
})

/**
 * DeleteAccount action with beneficiary
 */
const DeleteAccountSchema = b.struct({
  beneficiaryId: b.string(),
})

// ==================== Global Contract Actions ====================

/**
 * GlobalContractDeployMode enum
 * 0 = CodeHash (deploy by code hash)
 * 1 = AccountId (deploy by account ID)
 */
const GlobalContractDeployModeSchema = b.enum({
  CodeHash: b.struct({}),
  AccountId: b.struct({}),
})

/**
 * GlobalContractIdentifier enum
 * 0 = CodeHash (32-byte hash)
 * 1 = AccountId (string)
 */
const GlobalContractIdentifierSchema = b.enum({
  CodeHash: b.array(b.u8(), 32),
  AccountId: b.string(),
})

/**
 * DeployGlobalContract action
 */
const DeployGlobalContractSchema = b.struct({
  code: b.vec(b.u8()),
  deployMode: GlobalContractDeployModeSchema,
})

/**
 * UseGlobalContract action
 */
const UseGlobalContractSchema = b.struct({
  contractIdentifier: GlobalContractIdentifierSchema,
})

// ==================== Delegate Actions ====================

/**
 * ClassicActions enum - same as Action but without nested SignedDelegate
 * Used within DelegateAction to prevent infinite recursion
 * The signedDelegate variant uses a string placeholder
 */
const ClassicActionsSchema = b.enum({
  createAccount: CreateAccountSchema,
  deployContract: DeployContractSchema,
  functionCall: FunctionCallSchema,
  transfer: TransferSchema,
  stake: StakeSchema,
  addKey: AddKeySchema,
  deleteKey: DeleteKeySchema,
  deleteAccount: DeleteAccountSchema,
  signedDelegate: b.string(), // Placeholder - should not be used
  deployGlobalContract: DeployGlobalContractSchema,
  useGlobalContract: UseGlobalContractSchema,
})

/**
 * DelegateAction for meta-transactions
 * Allows one account to sign a transaction on behalf of another
 */
const DelegateActionSchema = b.struct({
  senderId: b.string(),
  receiverId: b.string(),
  actions: b.vec(ClassicActionsSchema),
  nonce: b.u64(),
  maxBlockHeight: b.u64(),
  publicKey: PublicKeySchema,
})

/**
 * SignedDelegate - a delegate action with signature
 */
const SignedDelegateSchema = b.struct({
  delegateAction: DelegateActionSchema,
  signature: SignatureSchema,
})

/**
 * Action enum matching NEAR protocol action discriminants
 * Order matters! Each position corresponds to the action type index:
 * 0 = CreateAccount
 * 1 = DeployContract
 * 2 = FunctionCall
 * 3 = Transfer
 * 4 = Stake
 * 5 = AddKey
 * 6 = DeleteKey
 * 7 = DeleteAccount
 * 8 = SignedDelegate (placeholder)
 * 9 = DeployGlobalContract (placeholder)
 * 10 = UseGlobalContract (placeholder)
 */
export const ActionSchema = b.enum({
  createAccount: CreateAccountSchema,
  deployContract: DeployContractSchema,
  functionCall: FunctionCallSchema,
  transfer: TransferSchema,
  stake: StakeSchema,
  addKey: AddKeySchema,
  deleteKey: DeleteKeySchema,
  deleteAccount: DeleteAccountSchema,
  signedDelegate: SignedDelegateSchema,
  deployGlobalContract: DeployGlobalContractSchema,
  useGlobalContract: UseGlobalContractSchema,
})

// ==================== Transaction ====================

/**
 * Transaction schema
 * Field order: signerId, publicKey, nonce, receiverId, blockHash, actions
 */
export const TransactionSchema = b.struct({
  signerId: b.string(),
  publicKey: PublicKeySchema,
  nonce: b.u64(),
  receiverId: b.string(),
  blockHash: b.array(b.u8(), 32),
  actions: b.vec(ActionSchema),
})

/**
 * SignedTransaction schema
 */
export const SignedTransactionSchema = b.struct({
  transaction: TransactionSchema,
  signature: SignatureSchema,
})

// ==================== Serialization Helpers ====================

/**
 * Convert our PublicKey type to zorsh-compatible format
 */
function publicKeyToZorsh(pk: PublicKey) {
  if (pk.keyType === 0) {
    // Ed25519
    return { ed25519Key: { data: Array.from(pk.data) } }
  } else {
    // Secp256k1
    return { secp256k1Key: { data: Array.from(pk.data) } }
  }
}

/**
 * Convert our Signature type to zorsh-compatible format
 */
function signatureToZorsh(sig: Signature) {
  if (sig.keyType === 0) {
    // Ed25519
    return { ed25519Signature: { data: Array.from(sig.data) } }
  } else {
    // Secp256k1
    return { secp256k1Signature: { data: Array.from(sig.data) } }
  }
}

/**
 * Convert an action to zorsh-compatible format
 */
function actionToZorsh(action: Action): b.infer<typeof ActionSchema> {
  const actionType = action.enum as string
  const actionData = action[actionType]

  // Handle each action type
  if (actionType === "createAccount") {
    return { createAccount: {} }
  } else if (actionType === "deployContract") {
    return {
      deployContract: {
        code: (actionData as { code: Uint8Array }).code
      }
    }
  } else if (actionType === "functionCall") {
    const fc = actionData as { methodName: string; args: Uint8Array; gas: bigint; deposit: bigint }
    return {
      functionCall: {
        methodName: fc.methodName,
        args: fc.args,
        gas: fc.gas,
        deposit: fc.deposit,
      }
    }
  } else if (actionType === "transfer") {
    return {
      transfer: {
        deposit: (actionData as { deposit: bigint }).deposit
      }
    }
  } else if (actionType === "stake") {
    const stake = actionData as { stake: bigint; publicKey: PublicKey }
    return {
      stake: {
        stake: stake.stake,
        publicKey: publicKeyToZorsh(stake.publicKey),
      }
    }
  } else if (actionType === "addKey") {
    const addKey = actionData as { publicKey: PublicKey; accessKey: { nonce: bigint; permission: unknown } }
    return {
      addKey: {
        publicKey: publicKeyToZorsh(addKey.publicKey),
        accessKey: {
          nonce: addKey.accessKey.nonce,
          permission: addKey.accessKey.permission,
        }
      }
    }
  } else if (actionType === "deleteKey") {
    const deleteKey = actionData as { publicKey: PublicKey }
    return {
      deleteKey: {
        publicKey: publicKeyToZorsh(deleteKey.publicKey),
      }
    }
  } else if (actionType === "deleteAccount") {
    return {
      deleteAccount: {
        beneficiaryId: (actionData as { beneficiaryId: string }).beneficiaryId,
      }
    }
  } else if (actionType === "signedDelegate") {
    const signedDelegate = actionData as {
      delegateAction: {
        senderId: string
        receiverId: string
        actions: Action[]
        nonce: bigint
        maxBlockHeight: bigint
        publicKey: PublicKey
      }
      signature: Signature
    }
    return {
      signedDelegate: {
        delegateAction: {
          senderId: signedDelegate.delegateAction.senderId,
          receiverId: signedDelegate.delegateAction.receiverId,
          actions: signedDelegate.delegateAction.actions.map(actionToZorsh),
          nonce: signedDelegate.delegateAction.nonce,
          maxBlockHeight: signedDelegate.delegateAction.maxBlockHeight,
          publicKey: publicKeyToZorsh(signedDelegate.delegateAction.publicKey),
        },
        signature: signatureToZorsh(signedDelegate.signature),
      }
    }
  } else if (actionType === "deployGlobalContract") {
    const deploy = actionData as { code: Uint8Array; deployMode: unknown }
    return {
      deployGlobalContract: {
        code: deploy.code,
        deployMode: deploy.deployMode,
      }
    }
  } else if (actionType === "useGlobalContract") {
    const use = actionData as { contractIdentifier: unknown }
    return {
      useGlobalContract: {
        contractIdentifier: use.contractIdentifier,
      }
    }
  }

  throw new Error(`Unknown action type: ${actionType}`)
}

/**
 * Serialize a transaction to bytes
 */
export function serializeTransaction(tx: Transaction): Uint8Array {
  return TransactionSchema.serialize({
    signerId: tx.signerId,
    publicKey: publicKeyToZorsh(tx.publicKey),
    nonce: tx.nonce,
    receiverId: tx.receiverId,
    blockHash: Array.from(tx.blockHash),
    actions: tx.actions.map(actionToZorsh),
  })
}

/**
 * Serialize a signed transaction to bytes
 */
export function serializeSignedTransaction(signedTx: SignedTransaction): Uint8Array {
  return SignedTransactionSchema.serialize({
    transaction: {
      signerId: signedTx.transaction.signerId,
      publicKey: publicKeyToZorsh(signedTx.transaction.publicKey),
      nonce: signedTx.transaction.nonce,
      receiverId: signedTx.transaction.receiverId,
      blockHash: Array.from(signedTx.transaction.blockHash),
      actions: signedTx.transaction.actions.map(actionToZorsh),
    },
    signature: signatureToZorsh(signedTx.signature),
  })
}

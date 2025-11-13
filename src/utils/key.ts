/**
 * Key generation and management utilities
 */

import { ed25519 } from "@noble/curves/ed25519.js"
import { HDKey } from "@scure/bip32"
import * as bip39 from "@scure/bip39"
import { wordlist } from "@scure/bip39/wordlists/english.js"
import { ED25519_KEY_PREFIX } from "../core/constants.js"
import {
  type KeyPair,
  KeyType,
  type PublicKey,
  type Signature,
} from "../core/types.js"

/**
 * Base58 encoding/decoding utilities
 */
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

function base58Encode(buffer: Uint8Array): string {
  const digits = [0]

  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i]!
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j]! << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }

    while (carry > 0) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }

  let result = ""
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result += BASE58_ALPHABET[0]
  }

  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]!]
  }

  return result
}

function base58Decode(str: string): Uint8Array {
  const bytes = [0]

  for (let i = 0; i < str.length; i++) {
    const char = str[i]!
    const value = BASE58_ALPHABET.indexOf(char)

    if (value === -1) {
      throw new Error(`Invalid base58 character: ${char}`)
    }

    let carry = value
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j]! * 58
      bytes[j] = carry & 0xff
      carry >>= 8
    }

    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  for (let i = 0; i < str.length && str[i] === BASE58_ALPHABET[0]; i++) {
    bytes.push(0)
  }

  return new Uint8Array(bytes.reverse())
}

/**
 * Ed25519 key pair implementation
 */
class Ed25519KeyPair implements KeyPair {
  publicKey: PublicKey
  secretKey: string
  private privateKey: Uint8Array

  constructor(secretKey: Uint8Array) {
    // secretKey is 64 bytes: [32 bytes private key][32 bytes public key]
    this.privateKey = secretKey.slice(0, 32)
    const publicKeyData = secretKey.slice(32)

    this.publicKey = {
      keyType: KeyType.ED25519,
      data: publicKeyData,
      toString: () => ED25519_KEY_PREFIX + base58Encode(publicKeyData),
    }

    this.secretKey = ED25519_KEY_PREFIX + base58Encode(secretKey)
  }

  sign(message: Uint8Array): Signature {
    const signature = ed25519.sign(message, this.privateKey)
    return {
      keyType: KeyType.ED25519,
      data: signature,
    }
  }

  static fromRandom(): Ed25519KeyPair {
    const privateKey = ed25519.utils.randomSecretKey()
    const publicKey = ed25519.getPublicKey(privateKey)

    // Combine into 64-byte format for compatibility
    const secretKey = new Uint8Array(64)
    secretKey.set(privateKey, 0)
    secretKey.set(publicKey, 32)

    return new Ed25519KeyPair(secretKey)
  }

  static fromString(keyString: string): Ed25519KeyPair {
    const key = keyString.replace(ED25519_KEY_PREFIX, "")
    const decoded = base58Decode(key)
    return new Ed25519KeyPair(decoded)
  }
}

/**
 * Generate a new random Ed25519 key pair
 * @returns A new KeyPair instance
 */
export function generateKey(): KeyPair {
  return Ed25519KeyPair.fromRandom()
}

/**
 * Parse a key string to a KeyPair
 * @param keyString - Key string (e.g., "ed25519:...")
 * @returns KeyPair instance
 */
export function parseKey(keyString: string): KeyPair {
  if (keyString.startsWith(ED25519_KEY_PREFIX)) {
    return Ed25519KeyPair.fromString(keyString)
  }

  throw new Error(`Unsupported key type: ${keyString}`)
}

/**
 * Generate a BIP39 seed phrase (12 words by default)
 * Uses proper BIP39 implementation with cryptographically secure randomness
 * @param wordCount - Number of words (12, 15, 18, 21, or 24). Defaults to 12
 * @returns A BIP39 seed phrase string
 */
export function generateSeedPhrase(
  wordCount: 12 | 15 | 18 | 21 | 24 = 12,
): string {
  // Map word count to entropy bits (as per BIP39 spec)
  const entropyBits = wordCount * 11 - wordCount / 3
  const entropyBytes = entropyBits / 8

  // Generate cryptographically secure random entropy
  const entropy = new Uint8Array(entropyBytes)
  crypto.getRandomValues(entropy)

  // Generate mnemonic from entropy
  return bip39.entropyToMnemonic(entropy, wordlist)
}

/**
 * Parse a BIP39 seed phrase to derive a key pair using proper BIP32/SLIP10 derivation
 * @param phrase - BIP39 seed phrase (12-24 words)
 * @param path - BIP32 derivation path (defaults to "m/44'/397'/0'" for NEAR)
 * @returns KeyPair instance
 */
export function parseSeedPhrase(
  phrase: string,
  path: string = "m/44'/397'/0'",
): KeyPair {
  // Validate the mnemonic
  if (!bip39.validateMnemonic(phrase, wordlist)) {
    throw new Error("Invalid BIP39 seed phrase")
  }

  // Convert mnemonic to seed (64 bytes)
  const seed = bip39.mnemonicToSeedSync(phrase)

  // Derive HD key using BIP32 with ed25519 (SLIP10)
  // Note: HDKey from @scure/bip32 supports ed25519 via SLIP10
  const hdkey = HDKey.fromMasterSeed(seed)
  const derived = hdkey.derive(path)

  if (!derived.privateKey) {
    throw new Error("Failed to derive private key from seed phrase")
  }

  // Get the ed25519 public key from private key
  const privateKey = derived.privateKey
  const publicKey = ed25519.getPublicKey(privateKey)

  // Combine into 64-byte format for compatibility
  const secretKey = new Uint8Array(64)
  secretKey.set(privateKey, 0)
  secretKey.set(publicKey, 32)

  return new Ed25519KeyPair(secretKey)
}

/**
 * Encode binary data to base58
 */
export { base58Decode, base58Encode }

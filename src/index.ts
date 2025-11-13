/**
 * @near/client - A simple, intuitive TypeScript library for interacting with NEAR Protocol
 */

// Main class
export { Near } from './core/near.js';

// Types
export type {
  NearConfig,
  NetworkConfig,
  KeyConfig,
  KeyPair,
  PublicKey,
  Signature,
  KeyStore,
  CallOptions,
  FinalExecutionOutcome,
  SimulationResult,
  WalletSignInOptions,
} from './core/types.js';

// Key stores
export {
  InMemoryKeyStore,
  FileKeyStore,
  EncryptedKeyStore,
} from './keys/index.js';

// Utilities
export {
  parseNearAmount,
  formatNearAmount,
  parseGas,
  formatGas,
  toGas,
  toTGas,
  generateKey,
  parseKey,
  generateSeedPhrase,
  parseSeedPhrase,
  isValidAccountId,
  isValidPublicKey,
} from './utils/index.js';

// Errors
export {
  NearError,
  InsufficientBalanceError,
  FunctionCallError,
  NetworkError,
  InvalidKeyError,
  AccountDoesNotExistError,
  AccessKeyDoesNotExistError,
  InvalidAccountIdError,
  SignatureError,
  GasLimitExceededError,
  TransactionTimeoutError,
  WalletError,
} from './errors/index.js';

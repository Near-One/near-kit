/**
 * Amount utilities for NEAR tokens
 *
 * All amounts must specify units explicitly:
 * - Amount.NEAR(10) → "10 NEAR"
 * - Amount.yocto(1000n) → "1000 yocto"
 * - "10 NEAR" (string literal)
 * - "1000 yocto" (string literal)
 *
 * No bare numbers accepted - prevents accidental unit confusion.
 */

import { YOCTO_PER_NEAR } from "../core/constants.js"

/**
 * Amount input type - must be a string with unit specification
 */
export type AmountInput = string

/**
 * Amount namespace - explicit constructors for NEAR values
 *
 * @example
 * Amount.NEAR(10)           // "10 NEAR"
 * Amount.NEAR(10.5)         // "10.5 NEAR"
 * Amount.NEAR("10.5")       // "10.5 NEAR"
 * Amount.yocto(1000000n)    // "1000000 yocto"
 * Amount.yocto("1000000")   // "1000000 yocto"
 */
export const Amount = {
  /**
   * Create a NEAR amount
   * @param value - Amount in NEAR
   * @returns Formatted string "X NEAR"
   */
  NEAR(value: number | string): string {
    return `${value} NEAR`
  },

  /**
   * Create a yoctoNEAR amount (10^-24 NEAR)
   * @param value - Amount in yoctoNEAR
   * @returns Formatted string "X yocto"
   */
  yocto(value: bigint | string): string {
    return `${value} yocto`
  },

  /**
   * Common amount constants
   */
  ZERO: "0 yocto",
  ONE_NEAR: "1 NEAR",
  ONE_YOCTO: "1 yocto",
} as const

/**
 * Parse amount string to yoctoNEAR
 * @param amount - Amount with unit (e.g., "10 NEAR", "1000 yocto")
 * @returns Amount in yoctoNEAR as string
 * @throws Error if format is invalid
 */
export function parseAmount(amount: AmountInput): string {
  const trimmed = amount.trim()

  // Parse "X NEAR" format (case insensitive)
  const nearMatch = trimmed.match(/^([\d.]+)\s+NEAR$/i)
  if (nearMatch) {
    const value = nearMatch[1]!
    return parseNearToYocto(value)
  }

  // Parse "X yocto" format
  const yoctoMatch = trimmed.match(/^(\d+)\s+yocto$/i)
  if (yoctoMatch) {
    return yoctoMatch[1]!
  }

  // Common mistake: bare number
  if (/^[\d.]+$/.test(trimmed)) {
    throw new Error(
      `Ambiguous amount: "${amount}". Did you mean "${amount} NEAR"?\n` +
        `  - Use Amount.NEAR(${amount}) for NEAR\n` +
        `  - Use Amount.yocto(${amount}) for yoctoNEAR\n` +
        `  - Or write "${amount} NEAR" or "${amount} yocto"`,
    )
  }

  // Invalid format
  throw new Error(
    `Invalid amount format: "${amount}"\n` +
      `Expected formats:\n` +
      `  - "10 NEAR" or Amount.NEAR(10)\n` +
      `  - "1000000 yocto" or Amount.yocto(1000000n)`,
  )
}

/**
 * Format yoctoNEAR to human-readable NEAR
 * @param yocto - Amount in yoctoNEAR
 * @param options - Formatting options
 * @returns Formatted string (e.g., "10.50 NEAR")
 */
export function formatAmount(
  yocto: string | bigint,
  options?: {
    precision?: number
    includeSuffix?: boolean
    trimZeros?: boolean
  },
): string {
  const {
    precision = 2,
    includeSuffix = true,
    trimZeros = false,
  } = options || {}

  const amount = typeof yocto === "string" ? BigInt(yocto) : yocto

  const wholePart = amount / YOCTO_PER_NEAR
  const fracPart = amount % YOCTO_PER_NEAR

  let result: string

  if (fracPart === BigInt(0)) {
    result = wholePart.toString()
  } else {
    const fracStr = fracPart.toString().padStart(24, "0")
    let decimals = fracStr.substring(0, precision)

    if (trimZeros) {
      decimals = decimals.replace(/0+$/, "")
    }

    result = decimals ? `${wholePart}.${decimals}` : wholePart.toString()
  }

  return includeSuffix ? `${result} NEAR` : result
}

/**
 * Internal: Parse NEAR value to yoctoNEAR
 */
function parseNearToYocto(value: string): string {
  // Validate format
  if (!/^[\d.]+$/.test(value)) {
    throw new Error(`Invalid NEAR value: ${value}`)
  }

  // Split into whole and fractional parts
  const parts = value.split(".")
  const wholePart = parts[0] || "0"
  const fracPart = (parts[1] || "").padEnd(24, "0").substring(0, 24)

  // Check for negative values
  if (wholePart.startsWith("-")) {
    throw new Error("NEAR amount must be non-negative")
  }

  // Convert to yoctoNEAR
  const yocto = BigInt(wholePart) * YOCTO_PER_NEAR + BigInt(fracPart)

  return yocto.toString()
}

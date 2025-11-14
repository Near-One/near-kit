/**
 * Unit tests for RPC retry logic and nonce retry handling
 */

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { RpcClient } from "../../src/core/rpc/rpc.js"
import { InvalidNonceError, NetworkError } from "../../src/errors/index.js"

describe("RPC Retry Logic", () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test("should retry on retryable NetworkError with exponential backoff", async () => {
    let attemptCount = 0
    const mockFetch = mock(async () => {
      attemptCount++
      if (attemptCount < 3) {
        // Fail with 503 Service Unavailable (retryable)
        return new Response(JSON.stringify({ error: "Service Unavailable" }), {
          status: 503,
          statusText: "Service Unavailable",
        })
      }
      // Succeed on 3rd attempt
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: { success: true },
        }),
        { status: 200 },
      )
    })

    global.fetch = mockFetch as unknown as typeof global.fetch

    const rpc = new RpcClient(
      "https://test.rpc.near.org",
      {},
      { maxRetries: 4, initialDelayMs: 100 },
    )
    const result = await rpc.call<{ success: boolean }>("test_method", {})

    expect(result.success).toBe(true)
    expect(attemptCount).toBe(3)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  }, 10000)

  test("should throw after max retries on persistent retryable error", async () => {
    let attemptCount = 0
    const mockFetch = mock(async () => {
      attemptCount++
      // Always fail with 503 Service Unavailable (retryable)
      return new Response(JSON.stringify({ error: "Service Unavailable" }), {
        status: 503,
        statusText: "Service Unavailable",
      })
    })

    global.fetch = mockFetch as unknown as typeof global.fetch

    const rpc = new RpcClient(
      "https://test.rpc.near.org",
      {},
      { maxRetries: 3, initialDelayMs: 50 },
    )

    await expect(async () => {
      await rpc.call("test_method", {})
    }).toThrow(NetworkError)

    // Should try initial + 3 retries = 4 total attempts
    expect(attemptCount).toBe(4)
  }, 10000)

  test("should not retry on non-retryable error (400 Bad Request)", async () => {
    let attemptCount = 0
    const mockFetch = mock(async () => {
      attemptCount++
      // Fail with 400 Bad Request (not retryable)
      return new Response(JSON.stringify({ error: "Bad Request" }), {
        status: 400,
        statusText: "Bad Request",
      })
    })

    global.fetch = mockFetch as unknown as typeof global.fetch

    const rpc = new RpcClient(
      "https://test.rpc.near.org",
      {},
      { maxRetries: 3, initialDelayMs: 50 },
    )

    await expect(async () => {
      await rpc.call("test_method", {})
    }).toThrow(NetworkError)

    // Should only try once (no retries for non-retryable errors)
    expect(attemptCount).toBe(1)
  }, 10000)

  test("should retry on 408 Request Timeout", async () => {
    let attemptCount = 0
    const mockFetch = mock(async () => {
      attemptCount++
      if (attemptCount < 2) {
        // Fail with 408 Request Timeout (retryable)
        return new Response(JSON.stringify({ error: "Request Timeout" }), {
          status: 408,
          statusText: "Request Timeout",
        })
      }
      // Succeed on 2nd attempt
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: { success: true },
        }),
        { status: 200 },
      )
    })

    global.fetch = mockFetch as unknown as typeof global.fetch

    const rpc = new RpcClient(
      "https://test.rpc.near.org",
      {},
      { maxRetries: 3, initialDelayMs: 50 },
    )
    const result = await rpc.call<{ success: boolean }>("test_method", {})

    expect(result.success).toBe(true)
    expect(attemptCount).toBe(2)
  }, 10000)

  test("should retry on 429 Too Many Requests", async () => {
    let attemptCount = 0
    const mockFetch = mock(async () => {
      attemptCount++
      if (attemptCount < 2) {
        // Fail with 429 Too Many Requests (retryable)
        return new Response(JSON.stringify({ error: "Too Many Requests" }), {
          status: 429,
          statusText: "Too Many Requests",
        })
      }
      // Succeed on 2nd attempt
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: { success: true },
        }),
        { status: 200 },
      )
    })

    global.fetch = mockFetch as unknown as typeof global.fetch

    const rpc = new RpcClient(
      "https://test.rpc.near.org",
      {},
      { maxRetries: 3, initialDelayMs: 50 },
    )
    const result = await rpc.call<{ success: boolean }>("test_method", {})

    expect(result.success).toBe(true)
    expect(attemptCount).toBe(2)
  }, 10000)

  test("should retry on network fetch failure", async () => {
    let attemptCount = 0
    const mockFetch = mock(async () => {
      attemptCount++
      if (attemptCount < 2) {
        // Simulate network failure
        throw new Error("fetch failed")
      }
      // Succeed on 2nd attempt
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: { success: true },
        }),
        { status: 200 },
      )
    })

    global.fetch = mockFetch as unknown as typeof global.fetch

    const rpc = new RpcClient(
      "https://test.rpc.near.org",
      {},
      { maxRetries: 3, initialDelayMs: 50 },
    )
    const result = await rpc.call<{ success: boolean }>("test_method", {})

    expect(result.success).toBe(true)
    expect(attemptCount).toBe(2)
  }, 10000)

  test("should respect custom retry configuration", async () => {
    let attemptCount = 0
    const mockFetch = mock(async () => {
      attemptCount++
      // Always fail
      return new Response(JSON.stringify({ error: "Service Unavailable" }), {
        status: 503,
        statusText: "Service Unavailable",
      })
    })

    global.fetch = mockFetch as unknown as typeof global.fetch

    // Custom config: max 2 retries, 25ms initial delay
    const rpc = new RpcClient(
      "https://test.rpc.near.org",
      {},
      { maxRetries: 2, initialDelayMs: 25 },
    )

    await expect(async () => {
      await rpc.call("test_method", {})
    }).toThrow(NetworkError)

    // Should try initial + 2 retries = 3 total attempts
    expect(attemptCount).toBe(3)
  }, 10000)
})

describe("InvalidNonceError Retry Logic", () => {
  test("InvalidNonceError should have retryable flag set to true", () => {
    const error = new InvalidNonceError(100, 99)
    expect(error.retryable).toBe(true)
    expect(error.txNonce).toBe(100)
    expect(error.akNonce).toBe(99)
    expect(error.code).toBe("INVALID_NONCE")
  })

  test("InvalidNonceError message should be descriptive", () => {
    const error = new InvalidNonceError(100, 99)
    expect(error.message).toContain("100")
    expect(error.message).toContain("99")
    expect(error.message).toContain("nonce")
  })
})

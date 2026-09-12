import { createClerkClient } from "@clerk/chrome-extension/client"
import { ConvexHttpClient } from "convex/browser"
import type { FunctionReference } from "convex/server"
import { ConvexError } from "convex/values"

import {
  CAPTURE_ERROR_CODES,
  type CaptureErrorCode,
  type CaptureRequestInput,
  type CaptureResult
} from "@inspira/contracts"

import { readExtensionConfig } from "~/lib/config"
import type { AuthStatus, CaptureOutcome } from "~/lib/messages"

/** JWT template that Convex expects; configured in the Clerk dashboard. */
const CONVEX_JWT_TEMPLATE = "convex"

type CaptureMutationArgs = {
  [Key in keyof CaptureRequestInput]: CaptureRequestInput[Key]
}

function createBackgroundClerkClient() {
  const config = readExtensionConfig()

  // `background: true` is the supported service-worker form; the
  // `@clerk/chrome-extension/background` entry point is deprecated. `syncHost`
  // points at the host holding the sign-in cookie, so a capture started from
  // the context menu works without opening the popup first.
  return createClerkClient({
    publishableKey: config.clerkPublishableKey,
    syncHost: config.syncHost,
    background: true
  })
}

type ClerkClient = Awaited<ReturnType<typeof createBackgroundClerkClient>>

let clerkClientPromise: Promise<ClerkClient> | undefined
let convexClient: ConvexHttpClient | undefined

function getClerkClient() {
  clerkClientPromise ??= createBackgroundClerkClient()

  return clerkClientPromise
}

/**
 * A worker can outlive the sign-in it started with: the cached client keeps
 * reporting no session after the user signs in on the web app, and Chrome only
 * evicts an idle worker. Loading a fresh client — it reads the session cookie
 * on load — is what lets the next capture succeed.
 */
async function getSessionClerkClient() {
  const clerk = await getClerkClient()

  if (clerk.session) {
    return clerk
  }

  clerkClientPromise = createBackgroundClerkClient()

  return await clerkClientPromise
}

function getConvexClient() {
  convexClient ??= new ConvexHttpClient(readExtensionConfig().convexUrl)

  return convexClient
}

export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const clerk = await getSessionClerkClient()

    return clerk.session ? "authenticated" : "anonymous"
  } catch {
    // A broken config or a Clerk failure must not read as "signed in".
    return "unknown"
  }
}

/**
 * Reads the Convex token for the current Clerk session. Returns null when the
 * user is signed out, which callers surface as the popup's sign-in state.
 */
export async function getConvexToken() {
  const clerk = await getSessionClerkClient()
  const token = await clerk.session?.getToken({
    template: CONVEX_JWT_TEMPLATE
  })

  return token ?? null
}

/**
 * Capture lives on the backend, but the extension cannot import the generated
 * Convex API (it is not published as a package), so the function reference is
 * asserted here and kept in one place.
 */
const captureMutation = "captures:capture" as unknown as FunctionReference<
  "mutation",
  "public",
  CaptureMutationArgs,
  CaptureResult
>

/**
 * The popup edits tags / remark after a capture. `updateDetails` only owns
 * those two fields and reports `NOT_FOUND` / `INVALID_INPUT` like `capture`.
 */
const updateDetailsMutation = "captures:updateDetails" as unknown as FunctionReference<
  "mutation",
  "public",
  { id: string; tags?: string[]; note?: string },
  string
>

function isCaptureErrorCode(value: string): value is CaptureErrorCode {
  return (CAPTURE_ERROR_CODES as readonly string[]).includes(value)
}

function toCaptureFailure(error: unknown): {
  code: CaptureErrorCode
  message: string
} {
  if (error instanceof ConvexError) {
    const data = error.data as
      | { code?: unknown; message?: unknown }
      | undefined

    if (typeof data?.code === "string" && isCaptureErrorCode(data.code)) {
      return {
        code: data.code,
        message:
          typeof data.message === "string"
            ? data.message
            : "Capture was rejected."
      }
    }
  }

  return {
    code: "TEMPORARY_FAILURE",
    message: "Network is unavailable. Try again."
  }
}

export async function saveCapture(
  input: CaptureRequestInput
): Promise<CaptureOutcome> {
  let token: string | null

  try {
    token = await getConvexToken()
  } catch {
    return {
      status: "failed",
      code: "TEMPORARY_FAILURE",
      message: "Could not read the sign-in state. Try again."
    }
  }

  if (!token) {
    return { status: "unauthorized" }
  }

  const client = getConvexClient()
  client.setAuth(token)

  try {
    const result = await client.mutation(captureMutation, input)

    return {
      status: "saved",
      inspirationId: result.inspirationId,
      created: result.created
    }
  } catch (error) {
    return { status: "failed", ...toCaptureFailure(error) }
  }
}

/**
 * Applies the popup's tags / remark edit to the capture it just saved. The
 * content already exists, so this reports success as a boolean instead of
 * throwing: a failed detail write must keep the popup on its success state.
 */
export async function updateCaptureDetails(
  inspirationId: string,
  tags: string[],
  note: string | undefined
): Promise<boolean> {
  let token: string | null

  try {
    token = await getConvexToken()
  } catch {
    return false
  }

  if (!token) {
    return false
  }

  const client = getConvexClient()
  client.setAuth(token)

  try {
    await client.mutation(updateDetailsMutation, { id: inspirationId, tags, note })

    return true
  } catch {
    return false
  }
}

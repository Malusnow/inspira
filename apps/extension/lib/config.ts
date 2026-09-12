/**
 * Build-time configuration. Plasmo inlines `PLASMO_PUBLIC_*` values at build
 * time, so a missing value must fail loudly instead of turning into an empty
 * string that breaks sign-in later. See apps/extension/README.md.
 */
const LANDING_URL_FALLBACK = "https://inspira.app"

export type ExtensionConfig = {
  clerkPublishableKey: string
  convexUrl: string
  landingUrl: string
  /**
   * Host Clerk syncs the session from — that is, where the sign-in cookie
   * lives. In development that is `http://localhost` (Clerk's dev browser
   * writes its cookie on localhost regardless of the port the web app runs
   * on); in production it is the Frontend API host. It must stay in step with
   * `host_permissions` in package.json: the manifest is filled from this same
   * variable, so changing it here alone leaves the extension without the host
   * permission it needs to read the cookie.
   */
  syncHost: string
}

export class MissingConfigError extends Error {
  readonly missingKeys: string[]

  constructor(missingKeys: string[]) {
    super(
      `Missing extension config: ${missingKeys.join(", ")}. ` +
        "Copy the values into .env.local (see apps/extension/README.md)."
    )
    this.name = "MissingConfigError"
    this.missingKeys = missingKeys
  }
}

function readEnv(value: string | undefined) {
  const trimmed = value?.trim()

  return trimmed ? trimmed : undefined
}

export function readExtensionConfig(): ExtensionConfig {
  const clerkPublishableKey = readEnv(
    process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY
  )
  const convexUrl = readEnv(process.env.PLASMO_PUBLIC_CONVEX_URL)
  const syncHost = readEnv(process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST)

  if (!clerkPublishableKey || !convexUrl || !syncHost) {
    throw new MissingConfigError([
      ...(clerkPublishableKey
        ? []
        : ["PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY"]),
      ...(convexUrl ? [] : ["PLASMO_PUBLIC_CONVEX_URL"]),
      ...(syncHost ? [] : ["PLASMO_PUBLIC_CLERK_SYNC_HOST"])
    ])
  }

  return {
    clerkPublishableKey,
    convexUrl,
    syncHost,
    landingUrl:
      readEnv(process.env.PLASMO_PUBLIC_LANDING_URL) ?? LANDING_URL_FALLBACK
  }
}

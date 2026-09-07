import { ClerkProvider, useAuth } from "@clerk/react"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App.tsx"

import "./styles/index.css"

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const convexUrl = import.meta.env.VITE_CONVEX_URL

const app = (() => {
  if (clerkPublishableKey && convexUrl) {
    const convex = new ConvexReactClient(convexUrl)

    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    )
  }

  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-6 text-ink">
      <section className="flex w-full max-w-md flex-col items-start gap-3 rounded-lg border border-line bg-surface p-6">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
          Inspira
        </p>
        <h1 className="text-2xl font-semibold text-ink-strong">
          Configuration required
        </h1>
        <p className="text-ink-muted">
          Set <code className="text-ink-strong">VITE_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="text-ink-strong">VITE_CONVEX_URL</code> before opening
          the private library.
        </p>
      </section>
    </main>
  )
})()

createRoot(document.getElementById("root")!).render(
  <StrictMode>{app}</StrictMode>
)

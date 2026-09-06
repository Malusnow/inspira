import { ClerkProvider, useAuth } from "@clerk/react"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App.tsx"

import "./index.css"

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
    <main className="setup-screen">
      <section className="setup-panel">
        <p className="eyebrow">Inspira</p>
        <h1>Configuration required</h1>
        <p>
          Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code>VITE_CONVEX_URL</code> before opening the private library.
        </p>
      </section>
    </main>
  )
})()

createRoot(document.getElementById("root")!).render(
  <StrictMode>{app}</StrictMode>
)

import { useUser } from "@clerk/react"
import { Loading } from "tdesign-react"

import { LandingPage } from "./features/landing/LandingPage"
import { EverythingPage } from "./features/library/EverythingPage"

function SessionLoadingScreen() {
  return (
    <main className="grid min-h-svh place-items-center bg-canvas text-ink">
      <Loading text="Loading session" />
    </main>
  )
}

export default function App() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <SessionLoadingScreen />
  }

  return isSignedIn ? <EverythingPage /> : <LandingPage />
}

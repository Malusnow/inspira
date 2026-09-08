import { useUser } from "@clerk/react"

import { LandingPage } from "./features/landing/LandingPage"
import { EverythingPage } from "./features/library/EverythingPage"
import { LoadingPage } from "./components/Loading"


export default function App() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <LoadingPage />
  }

  return isSignedIn ? <EverythingPage /> : <LandingPage />
}

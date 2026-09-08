import { useUser } from "@clerk/react"

import { AppRoutes } from "./app/AppRoutes"
import { LoadingPage } from "./components/Loading"
import { LandingPage } from "./features/landing/LandingPage"

export default function App() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <LoadingPage />
  }

  if (!isSignedIn) {
    return <LandingPage />
  }

  return <AppRoutes />
}

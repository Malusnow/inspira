import { useEffect, useState } from "react"

import { LandingFeatures } from "./LandingFeatures"
import { LandingHero } from "./LandingHero"
import { LandingNav } from "./LandingNav"
import { LandingPreview } from "./LandingPreview"
import { LandingPrivacy } from "./LandingPrivacy"
import { LandingTools } from "./LandingTools"

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <main className="relative isolate min-h-svh overflow-x-hidden bg-[#f7f6f2] text-[#20201e] scheme-light">
      <LandingNav isScrolled={isScrolled} />
      <LandingHero />
      <LandingFeatures />
      <LandingPreview />
      <LandingTools />
      <LandingPrivacy />
    </main>
  )
}

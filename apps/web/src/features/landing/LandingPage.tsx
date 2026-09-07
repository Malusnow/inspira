import { useEffect, useState } from "react"

import { LandingDemo } from "./LandingDemo"
import { LandingDownload } from "./LandingDownload"
import { LandingFeatures } from "./LandingFeatures"
import { LandingFooter } from "./LandingFooter"
import { LandingHero } from "./LandingHero"
import { LandingNav } from "./LandingNav"
import { LandingPreview } from "./LandingPreview"
import { LandingPrivacy } from "./LandingPrivacy"
import { LandingTools } from "./LandingTools"
import { VideoDialog } from "./VideoDialog"

export function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isVideoOpen ? "hidden" : ""

    return () => {
      document.body.style.overflow = ""
    }
  }, [isVideoOpen])

  return (
    <main className="relative isolate min-h-svh overflow-x-hidden bg-[#f7f6f2] text-[#20201e] scheme-light">
      <LandingNav isScrolled={isScrolled} />
      <LandingHero onOpenVideo={() => setIsVideoOpen(true)} />
      <LandingDemo onOpenVideo={() => setIsVideoOpen(true)} />
      <LandingFeatures />
      <LandingPreview />
      <LandingTools />
      <LandingPrivacy />
      <LandingDownload />
      <LandingFooter />
      {isVideoOpen ? <VideoDialog onClose={() => setIsVideoOpen(false)} /> : null}
    </main>
  )
}

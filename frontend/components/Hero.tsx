"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

gsap.registerPlugin()

const WORDS = ["Riverwood.", "Where land", "becomes", "legacy."]

export function Hero() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      // Staggered line reveal — each line slides up from below its clip boundary
      gsap.from(".hero-line", {
        yPercent: 105,
        opacity: 0,
        duration: 1.1,
        stagger: 0.14,
        ease: "power4.out",
        delay: 0.1,
      })

      // Subtle metadata fade in
      gsap.from(".hero-meta", {
        opacity: 0,
        y: 16,
        duration: 0.9,
        delay: 0.7,
        stagger: 0.1,
        ease: "power2.out",
      })

      // Scroll indicator
      gsap.from(".hero-scroll", {
        opacity: 0,
        y: 10,
        duration: 0.8,
        delay: 1.2,
        ease: "power2.out",
      })
    },
    { scope: root }
  )

  return (
    <section
      ref={root}
      className="relative min-h-screen bg-forest flex flex-col justify-between px-8 md:px-16 pt-12 pb-10"
    >
      {/* Header strip */}
      <header className="flex items-center justify-between">
        <span className="hero-meta text-bone/60 text-xs uppercase tracking-[0.25em] font-sans">
          Riverwood Projects — Est. 2009
        </span>
        <span className="hero-meta text-bone/40 text-xs uppercase tracking-[0.2em] font-sans">
          Premium Land Development
        </span>
      </header>

      {/* Hero title */}
      <div className="flex-1 flex flex-col justify-center py-16">
        <p className="hero-meta text-gold text-xs uppercase tracking-[0.3em] font-sans mb-8">
          AI Customer Connect
        </p>
        <h1 className="font-serif text-bone leading-[0.92] text-[clamp(3.5rem,10vw,9rem)]">
          {WORDS.map((word, i) => (
            <span
              key={i}
              className="overflow-clip block"
              aria-hidden={i > 0}
            >
              <span className="hero-line inline-block">{word}</span>
            </span>
          ))}
        </h1>

        <div className="mt-12 max-w-md">
          <p className="hero-meta text-bone/50 text-sm font-sans leading-relaxed">
            Our AI agent reaches your prospects personally — at the right moment,
            with the right message.
          </p>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-scroll flex items-center gap-3 text-bone/30">
        <div className="w-8 h-px bg-bone/30" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-sans">
          Scroll to experience
        </span>
      </div>

      {/* Decorative rule */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-bone/10" />
    </section>
  )
}

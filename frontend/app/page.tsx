import { Hero } from "@/components/Hero"
import { CallSection } from "@/components/CallSection"

export default function Home() {
  return (
    <main>
      <Hero />
      <CallSection />

      <footer className="bg-forest px-8 md:px-16 py-8 flex items-center justify-between">
        <span className="text-bone/30 text-[10px] uppercase tracking-[0.2em] font-sans">
          © 2026 Riverwood Projects
        </span>
        <span className="text-bone/20 text-[10px] font-sans">
          Backend: FastAPI · Docker · Vapi.ai
        </span>
      </footer>
    </main>
  )
}

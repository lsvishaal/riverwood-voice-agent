"use client"

import { useEffect, useState } from "react"
import { Phone, Mic, MicOff, X, AlertTriangle } from "lucide-react"
import { useVapi, type CallState } from "@/hooks/useVapi"
import {
  fetchFrontendCallConfig,
  triggerPhoneCall,
  type FrontendCallConfig,
} from "@/lib/backend-api"
import { VoiceVisualizer } from "./VoiceVisualizer"
import { cn } from "@/lib/utils"

/* ── Phone call form ───────────────────────────────────────────────────────── */
function PhoneCallForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    setStatus("loading")
    setErrorMsg("")

    try {
      await triggerPhoneCall({
        customer_name: name.trim(),
        phone_number: phone.trim(),
        delay_minutes: null,
      })

      setStatus("sent")
    } catch (err: unknown) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong — is the backend running?")
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-8 p-8 border border-forest/20 bg-bone-dark text-center">
        <div className="w-2 h-2 rounded-full bg-forest mx-auto mb-4 animate-[pulse-green_2s_ease-in-out_infinite]" />
        <p className="font-serif text-forest text-lg">Call initiated.</p>
        <p className="text-forest/50 text-xs font-sans mt-2 tracking-wider">
          Expect a call within moments.
        </p>
        <button
          onClick={onClose}
          className="mt-6 text-[10px] uppercase tracking-[0.2em] text-forest/40 hover:text-forest/70 transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-forest/50 mb-2 font-sans">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Arjun Sharma"
            required
            className="w-full bg-transparent border-b border-forest/30 focus:border-forest outline-none py-2 text-forest font-sans text-sm placeholder:text-forest/25 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-forest/50 mb-2 font-sans">
            Phone (E.164 format)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
            required
            className="w-full bg-transparent border-b border-forest/30 focus:border-forest outline-none py-2 text-forest font-sans text-sm placeholder:text-forest/25 transition-colors"
          />
        </div>
      </div>

      {status === "error" && (
        <div className="flex items-start gap-2 text-red-600 text-xs font-sans">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex items-center gap-6 pt-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex items-center gap-2 bg-forest text-bone px-6 py-3 text-xs uppercase tracking-[0.2em] font-sans hover:bg-forest-mid transition-colors disabled:opacity-50"
        >
          <Phone size={12} />
          {status === "loading" ? "Connecting…" : "Call Me Now"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] uppercase tracking-[0.2em] text-forest/40 hover:text-forest/70 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

/* ── Web call button states ─────────────────────────────────────────────────── */
const webCallConfig: Record<
  CallState,
  { label: string; className: string; icon?: React.ReactNode }
> = {
  idle: {
    label: "Speak Now — Web Call",
    className: "border-gold text-gold hover:bg-gold hover:text-forest-dark",
    icon: <Mic size={14} />,
  },
  connecting: {
    label: "Connecting…",
    className: "border-gold text-gold animate-[pulse-gold_1.5s_ease-in-out_infinite]",
    icon: <Mic size={14} className="animate-pulse" />,
  },
  active: {
    label: "In Call",
    className: "border-forest-mid bg-forest-mid text-bone",
    icon: null,
  },
  ended: {
    label: "Call Ended",
    className: "border-forest/30 text-forest/40 cursor-default",
    icon: <MicOff size={14} />,
  },
  error: {
    label: "Try Again",
    className:
      "border-red-400/60 text-red-500 hover:border-red-400 hover:bg-red-50",
    icon: <AlertTriangle size={14} />,
  },
}

/* ── Main section ────────────────────────────────────────────────────────────── */
export function CallSection() {
  const isPstnRestricted = true
  const [showPhoneForm, setShowPhoneForm] = useState(false)
  const [showPstnNotice, setShowPstnNotice] = useState(false)
  const [webConfig, setWebConfig] = useState<FrontendCallConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const { state, volume, errorMessage, startCall, stopCall } = useVapi()

  useEffect(() => {
    let mounted = true
    fetchFrontendCallConfig()
      .then((config) => {
        if (!mounted) return
        setWebConfig(config)
        setConfigError(null)
      })
      .catch((error: unknown) => {
        if (!mounted) return
        setConfigError(error instanceof Error ? error.message : "Failed to load call config")
      })

    return () => {
      mounted = false
    }
  }, [])

  const cfg = webCallConfig[state]

  const handleWebButtonClick =
    state === "idle" || state === "error"
      ? () => {
          if (!webConfig?.web_call_enabled || !webConfig.public_key || !webConfig.assistant_id) {
            return
          }
          startCall({
            publicKey: webConfig.public_key,
            assistantId: webConfig.assistant_id,
          })
        }
      : state === "active"
      ? stopCall
      : undefined

  const webCallDisabled =
    state === "connecting" ||
    state === "ended" ||
    !webConfig?.web_call_enabled ||
    !!configError

  return (
    <section className="min-h-screen bg-bone flex flex-col justify-center px-8 md:px-16 py-24">
      {/* Section label */}
      <div className="flex items-center gap-4 mb-16">
        <div className="w-12 h-px bg-forest/20" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-forest/40 font-sans">
          Experience It
        </span>
      </div>

      {/* Heading */}
      <h2 className="font-serif text-forest text-[clamp(2rem,6vw,5rem)] leading-[1.05] max-w-2xl mb-6">
        Speak directly with our AI.
      </h2>
      <p className="text-forest/50 text-sm font-sans max-w-md mb-16 leading-relaxed">
        Two ways to connect. Get a call on your phone, or start a live web
        conversation right now in your browser.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col gap-6">
        {/* ── Option A: Phone call ── */}
        <div>
          <button
            onClick={() => {
              if (isPstnRestricted) {
                setShowPstnNotice((v) => !v)
                setShowPhoneForm(false)
                return
              }
              setShowPstnNotice(false)
              setShowPhoneForm(!showPhoneForm)
            }}
            className={cn(
              "flex items-center gap-3 border px-8 py-4 text-xs uppercase tracking-[0.2em] font-sans transition-all duration-200",
              showPhoneForm
                ? "border-forest bg-forest text-bone"
                : "border-forest/40 text-forest hover:border-forest hover:bg-forest hover:text-bone"
            )}
          >
            <Phone size={14} />
            Call My Phone
            {showPhoneForm && <X size={12} className="ml-auto" />}
          </button>

          {isPstnRestricted && showPstnNotice && (
            <div className="mt-5 max-w-xl border border-gold/30 bg-bone-dark p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-gold mt-0.5 shrink-0" />
                <p className="text-[11px] text-forest/80 font-sans leading-relaxed">
                  PSTN outbound is intentionally restricted in this demo due to trial-tier carrier routing limits.
                  Backend call infrastructure is ready; use <span className="font-medium">Speak Now — Web Call</span> for live testing.
                </p>
              </div>
            </div>
          )}

          {!isPstnRestricted && showPhoneForm && (
            <PhoneCallForm onClose={() => setShowPhoneForm(false)} />
          )}
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4">
          <div className="h-px bg-forest/10 flex-1 max-w-[4rem]" />
          <span className="text-[10px] text-forest/30 uppercase tracking-[0.2em] font-sans">
            or
          </span>
        </div>

        {/* ── Option B: Web call ── */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleWebButtonClick}
            disabled={webCallDisabled}
            className={cn(
              "flex items-center gap-3 border px-8 py-4 text-xs uppercase tracking-[0.2em] font-sans transition-all duration-300 w-fit",
              cfg.className
            )}
          >
            {state === "active" ? (
              <VoiceVisualizer volume={volume} active={true} />
            ) : (
              cfg.icon
            )}
            {cfg.label}
            {state === "active" && (
              <MicOff size={12} className="ml-2 opacity-50" />
            )}
          </button>

          {/* Status/error messages */}
          {state === "active" && (
            <p className="text-[10px] text-forest/40 uppercase tracking-[0.2em] font-sans">
              Click the button above to end the call
            </p>
          )}

          {state === "ended" && (
            <p className="text-[10px] text-forest/50 uppercase tracking-[0.2em] font-sans">
              Call summary in your Vapi dashboard ·{" "}
              <span className="text-gold">Resetting…</span>
            </p>
          )}

          {state === "error" && errorMessage && (
            <div className="flex items-start gap-2 max-w-sm">
              <AlertTriangle size={11} className="text-red-400/70 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-500/80 font-sans leading-relaxed">
                {errorMessage}
              </p>
            </div>
          )}

          {configError && (
            <div className="flex items-start gap-2 max-w-sm">
              <AlertTriangle size={11} className="text-red-400/70 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-500/80 font-sans leading-relaxed">
                {configError}
              </p>
            </div>
          )}

          {webConfig && !webConfig.web_call_enabled && !configError && (
            <p className="text-[11px] text-forest/50 font-sans leading-relaxed max-w-sm">
              Web call is disabled. Set VAPI_PUBLIC_API_KEY in backend environment to enable browser calls.
            </p>
          )}
        </div>
      </div>

      {/* Bottom rule */}
      <div className="mt-24 flex items-end justify-between">
        <div className="h-px bg-forest/10 flex-1" />
        <span className="ml-8 text-[10px] text-forest/25 uppercase tracking-[0.2em] font-sans">
          Powered by Vapi · ElevenLabs · GPT-4o-mini
        </span>
      </div>
    </section>
  )
}

"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Vapi from "@vapi-ai/web"

export type CallState = "idle" | "connecting" | "active" | "ended" | "error"

interface UseVapiReturn {
  state: CallState
  volume: number
  errorMessage: string | null
  startCall: (config: { publicKey: string; assistantId: string }) => Promise<void>
  stopCall: () => void
}

const CHANNEL_GUARDRAIL =
  "Important policy: do not promise WhatsApp, SMS, email, or follow-up messages unless the system explicitly confirms that capability in this session. If unavailable, say you can only continue on this live call."

// Vapi emits { type, stage, error: { message, ... }, timestamp } OR bare Error objects.
function extractErrorMessage(e: unknown): string {
  if (e === null || e === undefined) return "Unknown call error"
  const obj = e as Record<string, unknown>
  // Vapi SDK structured error payload
  if (typeof obj?.error === "object" && obj.error !== null) {
    const inner = obj.error as Record<string, unknown>
    if (typeof inner.message === "string" && inner.message) return inner.message
  }
  // Standard Error instance or anything with .message
  if (typeof obj?.message === "string" && obj.message) return obj.message
  // Bare string
  if (typeof e === "string" && e) return e
  // Last resort — serialize and truncate
  try {
    const str = JSON.stringify(e)
    if (str && str !== "{}") return str.slice(0, 200)
  } catch {
    // ignore
  }
  return "Call failed — check console for details"
}

export function useVapi(): UseVapiReturn {
  const vapiRef = useRef<Vapi | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [state, setState] = useState<CallState>("idle")
  const [volume, setVolume] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const scheduleIdleReset = useCallback((ms: number) => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }
    resetTimerRef.current = setTimeout(() => {
      setState("idle")
      resetTimerRef.current = null
    }, ms)
  }, [])

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
      vapiRef.current?.stop()
      vapiRef.current = null
    }
  }, [])

  // Build a fresh Vapi singleton. Error and end handlers do cleanup.
  const getInstance = useCallback(
    (publicKey: string): Vapi => {
      if (!vapiRef.current) {
        vapiRef.current = new Vapi(publicKey)

        vapiRef.current.on("call-start", () => {
          setState("active")
          setErrorMessage(null)

          // Reinforce channel policy to reduce hallucinated follow-up promises.
          try {
            vapiRef.current?.send({
              type: "add-message",
              message: {
                role: "system",
                content: CHANNEL_GUARDRAIL,
              },
            })
          } catch (err: unknown) {
            console.warn("[Vapi guardrail send failed]", err)
          }
        })

        vapiRef.current.on("call-end", () => {
          setState("ended")
          setVolume(0)
          scheduleIdleReset(3000)
        })

        vapiRef.current.on("volume-level", (v: number) => setVolume(v))

        vapiRef.current.on("message", (message: unknown) => {
          const m = message as { type?: string; role?: string; transcript?: string }
          if (m?.type === "transcript" && m.transcript) {
            console.info(`[Vapi transcript] ${m.role ?? "unknown"}: ${m.transcript}`)
          }
        })

        vapiRef.current.on("error", (e: unknown) => {
          const msg = extractErrorMessage(e)
          console.error("[Vapi error]", { raw: e, extracted: msg })
          setErrorMessage(msg)
          setState("error")
          setVolume(0)
          // Destroy the instance so a fresh connection is made on retry
          vapiRef.current = null
          scheduleIdleReset(5000)
        })
      }
      return vapiRef.current
    },
    [scheduleIdleReset]
  )

  const startCall = useCallback(
    async (config: { publicKey: string; assistantId: string }) => {
      if (!config.publicKey) {
        setErrorMessage("Web-call config missing public key.")
        setState("error")
        scheduleIdleReset(6000)
        return
      }

      if (!config.assistantId) {
        setErrorMessage("Web-call config missing assistant id.")
        setState("error")
        scheduleIdleReset(6000)
        return
      }

      setErrorMessage(null)
      setState("connecting")

      try {
        const vapi = getInstance(config.publicKey)
        await vapi.start(config.assistantId)
      } catch (err) {
        const msg = extractErrorMessage(err)
        console.error("[Vapi start failed]", { raw: err, extracted: msg })
        setErrorMessage(msg)
        setState("error")
        vapiRef.current = null
        scheduleIdleReset(5000)
      }
    },
    [getInstance, scheduleIdleReset]
  )

  const stopCall = useCallback(() => {
    vapiRef.current?.stop()
    setState("ended")
    setVolume(0)
    setErrorMessage(null)
    scheduleIdleReset(3000)
  }, [scheduleIdleReset])

  return { state, volume, errorMessage, startCall, stopCall }
}

export interface TriggerCallPayload {
  customer_name: string
  phone_number: string
  delay_minutes: number | null
}

export interface FrontendCallConfig {
  web_call_enabled: boolean
  assistant_id: string | null
  public_key: string | null
}

interface ApiErrorPayload {
  detail?: string
}

function backendBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000").replace(/\/$/, "")
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return "Unexpected error"
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${backendBaseUrl()}${path}`, init)
}

export async function triggerPhoneCall(payload: TriggerCallPayload): Promise<void> {
  const res = await request("/api/calls/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const data = await parseJson<ApiErrorPayload>(res)
    const detail = data?.detail
    throw new Error(detail ?? `Server error ${res.status}`)
  }
}

export async function fetchFrontendCallConfig(): Promise<FrontendCallConfig> {
  try {
    const res = await request("/api/frontend/call-config", {
      cache: "no-store",
    })
    if (!res.ok) {
      throw new Error(`Unable to load call config (${res.status})`)
    }
    const payload = await parseJson<FrontendCallConfig>(res)
    if (!payload) {
      throw new Error("Invalid call config response")
    }
    return payload
  } catch (error) {
    throw new Error(parseErrorMessage(error))
  }
}

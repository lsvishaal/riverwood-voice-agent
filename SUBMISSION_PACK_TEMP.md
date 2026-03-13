# Riverwood Internship Submission Pack (Temporary)

Use this file as copy/paste material for final submission.

---

## 1) Short Technical Note

Project: Riverwood AI Voice Agent MVP

This prototype implements a human-like outbound customer update flow for Riverwood Estate using Vapi, OpenAI, and ElevenLabs.

Architecture summary:

1. FastAPI backend handles trigger/scheduling and webhook ingestion.
2. Vapi executes call orchestration, LLM response generation, STT/TTS pipeline, and call delivery.
3. Next.js frontend is a thin UI layer for web call mode and API trigger interaction.
4. End-of-call webhook captures transcript/summary artifacts and logs outcomes.

Conversation design choices:

1. 1-2 sentence response policy to reduce latency and maintain natural rhythm.
2. Bilingual handling (English first, switch to Hindi or mixed style based on user speech).
3. Strict guardrails to avoid unsupported promises (e.g., WhatsApp follow-up unless enabled).
4. Deterministic objective completion: verify owner → share update → ask weekend visit intent → close politely.

Scalability design for 1000 calls every morning:

1. Queue-based campaign batching (worker consumers) with controlled concurrency.
2. Rate limiting and retry policy per phone/attempt to avoid provider throttling.
3. Horizontal worker scaling and phone-number pool strategy for throughput.
4. Persisted call outcomes and structured outputs for CRM sync and reporting.

---

## 2) Cost Estimate (Per 1000 Calls)

Given current dashboard estimate: `~$0.11/min`

Assumption: average call length = `1.5 minutes`

Calculation:

1. 1000 × 1.5 = 1500 total minutes
2. 1500 × $0.11 = `$165/day`

Estimated runtime cost: **~$165 per 1000 calls** (excluding additional infra/platform overhead).

---

## 3) Submission Email Template

Subject: Riverwood AI Systems Internship Challenge Submission – [Your Name]

Hello Sanyam,

Please find my submission for the Riverwood AI Voice Agent Prototype challenge.

1. Loom Demo: [PASTE LOOM LINK]
2. Code/Demo Link: [PASTE GITHUB/DRIVE/REPLIT LINK]
3. Short Technical Note: Included below
4. Estimated Cost per 1000 Calls: ~`$165` (assuming 1.5 min average call at ~$0.11/min)

Technical Note (short):
[PASTE SECTION "Short Technical Note" FROM ABOVE]

Thank you for the opportunity.

Best regards,
[Your Name]
[Phone]
[Email]

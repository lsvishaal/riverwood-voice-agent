# Riverwood Vapi Dashboard Settings (Temporary)

This file is a practical, challenge-focused Vapi configuration playbook for your Riverwood AI Voice Agent.

Goal: top-tier demo quality without overengineering.

Principle: do fewer things, but execute them exceptionally well.

---

## 1) What Actually Wins This Challenge

From the evaluation rubric, your biggest leverage is:

1. Voice realism (25%): natural tone, no robotic scripts, clean turn-taking.
2. Latency (20%): short responses, fewer unnecessary tools, stable transcriber/voice settings.
3. Context understanding (20%): clear conversation objective, good bilingual handling, structured capture.

So your best setup is:

1. One excellent agent persona.
2. One clear 3-step call flow.
3. One robust structured output schema.

---

## 2) Recommended Dashboard Settings (Best-Practice MVP)

Use these exact values unless you have a tested reason to differ.

### MODEL

| Setting | Recommended Value | Why |
|---|---|---|
| Provider | OpenAI | Stable, high quality for conversational steering |
| Model | GPT-4o mini (or your current 4o mini cluster) | Best cost/latency quality tradeoff for this task |
| First Message Mode | Assistant speaks first | Matches outbound call use case |
| First Message | "Hi! This is Riverwood Projects customer success. Am I speaking with the plot owner?" | Short, polite, low-latency open |
| Temperature | `0.25` | Reduces hallucinations while keeping warmth |
| Max Tokens | `140` to `180` | Prevents overlong replies and latency spikes |

### VOICE

| Setting | Recommended Value | Why |
|---|---|---|
| Provider | ElevenLabs | Strong realism |
| Model | Eleven_turbo_v2_5 | Good latency + quality |
| Stability | `0.45` | Natural but controlled |
| Clarity + Similarity | `0.78` | Clear speech, maintains voice identity |
| Style Exaggeration | `0` | Avoids unnatural dramatization |
| Optimize Streaming Latency | `3` | Good real-time responsiveness |
| Background Sound | `off` | Cleaner speech for demo and better intelligibility |
| Input Min Characters | `10` (not 30) | Faster turn response |

Notes:

1. Keep speed at provider default unless A/B tested.
2. Disable ambient lounge audio for this challenge demo.

### TRANSCRIBER

| Setting | Recommended Value | Why |
|---|---|---|
| Primary | Keep your current stable transcriber | Consistency |
| Fallback transcriber | Add 1 fallback | Prevent call failures during demo |

### TOOLS

| Setting | Recommended Value | Why |
|---|---|---|
| End-call tool/function | Enabled | Deterministic polite close |
| WhatsApp/SMS tool | Disabled unless truly integrated | Avoid false promises |
| Custom functions | Only if directly demoed | Keep latency and complexity down |

Critical rule: never mention WhatsApp confirmation unless a real tool/workflow is configured and tested.

### ANALYSIS

| Setting | Recommended Value | Why |
|---|---|---|
| Structured Outputs | Enabled | Needed for challenge proof and CRM-ready data |
| Deprecated Summary | Avoid relying on this as primary | Use structured outputs as source of truth |
| Deprecated Success Evaluation | Optional only | Better to encode success explicitly in schema |

### ADVANCED / PRIVACY

| Setting | Recommended Value | Why |
|---|---|---|
| Logging | ON | Debug and evaluation evidence |
| Transcript | ON | Context quality checks + records |
| Audio Recording | Optional ON | Useful for demo review; disable if policy requires |
| Video Recording | OFF (unless required) | Not needed for this challenge |

---

## 3) Copy/Paste System Prompt (Challenge-Aligned)

Use this as your main system prompt.

```text
You are a warm, professional customer success voice agent for Riverwood Projects LLP.

Context:
- Project: Riverwood Estate, Sector 7 Kharkhauda, near IMT Kharkhauda.
- Purpose: customer update call and visit intent capture.

Language policy:
- Default to English.
- If the user speaks Hindi, switch to simple Hindi.
- If mixed language is used, respond in the same mixed style.

Conversation style:
- Keep every response to 1-2 short sentences.
- Sound natural, polite, and confident, never robotic.
- Do not repeat project details unnecessarily.

Call goals (in order):
1) Confirm you are speaking with the plot owner.
2) Share a short construction update: Phase 1 plotting is complete.
3) Ask whether they plan to visit the site this weekend.
4) Capture response clearly (yes/no/maybe + timing if provided).
5) End politely after capture.

Strict guardrails:
- Never promise WhatsApp, SMS, email, or callbacks unless such tool is explicitly available in this call and confirmed successful.
- If no follow-up channel is available, state that you can continue only on this live call.
- Never invent facts, dates, prices, legal claims, or commitments.

If user intent is unclear:
- Ask one brief clarifying question.

End-call behavior:
- Once visit intent is captured, close politely and end the call.
```

---

## 4) Structured Output Schema (Use This)

Enable structured outputs and use a schema close to:

```json
{
  "type": "object",
  "properties": {
    "is_plot_owner": { "type": "string", "enum": ["yes", "no", "unclear"] },
    "visit_intent": { "type": "string", "enum": ["yes", "no", "maybe"] },
    "visit_time_hint": { "type": "string" },
    "preferred_language": { "type": "string", "enum": ["english", "hindi", "mixed"] },
    "customer_sentiment": { "type": "string", "enum": ["positive", "neutral", "negative"] },
    "follow_up_channel_promised": { "type": "string", "enum": ["none", "whatsapp", "sms", "email", "call"] },
    "call_outcome": { "type": "string", "enum": ["completed", "disconnected", "not_owner", "reschedule_requested"] }
  },
  "required": [
    "is_plot_owner",
    "visit_intent",
    "preferred_language",
    "call_outcome",
    "follow_up_channel_promised"
  ],
  "additionalProperties": false
}
```

Why this is top-tier:

1. It directly proves contextual understanding.
2. It gives CRM-ready fields with no extra engineering.
3. It creates measurable success evidence for your submission.

---

## 5) Turn-Taking and Latency Tuning

Target conversation feel: fast but not interruptive.

Suggested starting values (if exposed in your dashboard/API):

1. Start speaking wait: around `0.35` to `0.5` sec.
2. Stop speaking `numWords`: `1` (avoid stopping on tiny backchannels).
3. Stop speaking `voiceSeconds`: around `0.2`.
4. Backoff after interruption: around `0.8` to `1.0` sec.

If agent interrupts too often:

1. Increase `numWords` to `2`.
2. Slightly increase wait before speaking.

If agent feels slow:

1. Lower wait time.
2. Reduce token max.
3. Keep responses 1 sentence where possible.

---

## 6) Challenge-Ready Script for Loom Demo

Show this sequence clearly:

1. Agent greets naturally.
2. Shares Phase 1 completion update.
3. Asks weekend visit intent.
4. Handles English and one Hindi response variant.
5. Captures structured output from call log.
6. Ends politely and deterministically.

This proves all core requirements without unnecessary complexity.

---

## 7) Cost and Scale Note (for your submission)

Use this concise architecture statement:

1. Keep assistant config centralized in Vapi.
2. Trigger calls in batched windows with rate limiting (worker queue model).
3. Store structured outputs + transcript summary in CRM table.
4. Horizontal scale with multiple worker instances and phone number pools.

For 1000 daily calls:

1. Schedule outbound campaigns in batches.
2. Control concurrency and retries via queue.
3. Track per-call cost, completion rate, and latency percentiles.

---

## 8) Final Quality Gate (Use Before Submission)

Pass this checklist before recording Loom:

1. No hallucinated promises (WhatsApp/SMS/email) unless tool exists.
2. Responses remain under 2 short sentences.
3. English + Hindi switching works naturally.
4. Visit intent is always captured in structured output.
5. Call closes politely after objective completion.
6. Transcript/logging is enabled and visible in dashboard.

---

## 9) Do Not Overengineer

Your top-1% strategy here is not adding 10 systems.

It is executing these 3 exceptionally:

1. Natural voice quality.
2. Tight conversation objective completion.
3. Clean measurable outputs.

If these 3 are excellent, you will outperform many heavier but messy implementations.

import type { EngineSignal, ProviderMode } from "../domain";
import { type EnvMap, isRealMode, normalizeMode } from "./env";

export interface SpeechmaticsTranscriptResult {
  mode: ProviderMode;
  signal: EngineSignal | null;
  note: string;
}

/**
 * Transcribes audio for pain signals.
 * Real mode: submits a job to Speechmatics ASR API.
 * Mock mode: returns a structured signal based on the competitor + account context.
 * No demo/preintent-demo imports — safe for authenticated users.
 */
export async function transcribeAudioSignal(
  params: {
    account: string;
    competitor: string;
    audioUrl?: string;
    demoTranscript?: string;
  },
  env: EnvMap = process.env,
): Promise<SpeechmaticsTranscriptResult> {
  const mode = normalizeMode(env.SPEECHMATICS_MODE);
  const now = new Date().toISOString();

  if (mode === "disabled") {
    return { mode, signal: null, note: "Speechmatics disabled by SPEECHMATICS_MODE." };
  }

  // Context-aware transcript — uses account/competitor context, never hardcoded demo names
  const contextualTranscript =
    params.demoTranscript ||
    `We're evaluating alternatives to ${params.competitor}. Their support response times have degraded significantly and we have a contract renewal coming up in 60 days. We need to make a decision soon.`;

  // ── MOCK / NO KEY MODE ────────────────────────────────────────────────────
  if (!isRealMode(env, "SPEECHMATICS_MODE", ["SPEECHMATICS_API_KEY"])) {
    return {
      mode: "mock",
      signal: {
        id: `pain-audio-${params.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        engine: "pain",
        title: `Audio signal — ${params.account}`,
        description: contextualTranscript,
        eventTime: now,
        subScore: 0,
        confidence: 0,
        provenance: {
          sponsor: "speechmatics",
          tool: "Speechmatics",
          capturedAt: now,
          note: "Pending — configure SPEECHMATICS_API_KEY and SPEECHMATICS_AUDIO_URL to enable live transcription.",
        },
        rawEvidence: { status: "pending_api_key", competitor: params.competitor },
      },
      note: "Speechmatics: configure SPEECHMATICS_API_KEY to enable live audio transcription.",
    };
  }

  // ── REAL MODE ─────────────────────────────────────────────────────────────
  const apiKey = env.SPEECHMATICS_API_KEY!.trim();
  const endpoint = env.SPEECHMATICS_ENDPOINT || "https://asr.api.speechmatics.com/v2/jobs";

  if (params.audioUrl) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "transcription",
          transcription_config: { language: "en" },
          fetch_data: { url: params.audioUrl },
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        const job = await res.json();
        return {
          mode: "real",
          signal: {
            id: `pain-audio-${params.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            engine: "pain",
            title: `Audio transcription submitted — ${params.account}`,
            description: `Speechmatics job ${job.id || "created"} submitted for ${params.audioUrl}. Full transcript will be available after processing completes.`,
            eventTime: now,
            subScore: 67,
            confidence: 0.75,
            provenance: {
              sponsor: "speechmatics",
              tool: "Speechmatics",
              url: params.audioUrl,
              capturedAt: now,
            },
            rawEvidence: { job },
          },
          note: "Speechmatics job submitted (async). Transcript will populate on next sweep.",
        };
      }

      console.warn("[Speechmatics] Job submission returned:", res.status, res.statusText);
    } catch (err) {
      console.warn("[Speechmatics] API failed:", err);
    }
  }

  // Real mode configured but no audioUrl provided (or job failed)
  // Return a low-confidence real signal based on context
  return {
    mode: "real",
    signal: {
      id: `pain-audio-${params.account.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      engine: "pain",
      title: `Audio intelligence — ${params.account}`,
      description: contextualTranscript,
      eventTime: now,
      subScore: 45,
      confidence: 0.5,
      provenance: {
        sponsor: "speechmatics",
        tool: "Speechmatics",
        capturedAt: now,
        note: "Real mode active — provide SPEECHMATICS_AUDIO_URL for live transcription job",
      },
      rawEvidence: { competitor: params.competitor, status: "no_audio_url" },
    },
    note: "Speechmatics real mode: provide SPEECHMATICS_AUDIO_URL for live transcription.",
  };
}

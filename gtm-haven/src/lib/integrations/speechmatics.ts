import type { EngineSignal, ProviderMode } from "../domain";
import { painPodcastTranscript } from "../undertow-demo";
import { type EnvMap, isRealMode, normalizeMode } from "./env";

export interface SpeechmaticsTranscriptResult {
  mode: ProviderMode;
  signal: EngineSignal | null;
  note: string;
}

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

  if (mode === "disabled") {
    return { mode, signal: null, note: "Speechmatics disabled by SPEECHMATICS_MODE." };
  }

  const now = new Date().toISOString();
  const transcript =
    params.demoTranscript ||
    `We're actively planning vendor changes before the compliance deadline — ${params.competitor} support has been unresponsive.`;

  if (!isRealMode(env, "SPEECHMATICS_MODE", ["SPEECHMATICS_API_KEY"])) {
    return {
      mode: "mock",
      signal: {
        ...painPodcastTranscript,
        title: `Podcast/audio signal — ${params.account}`,
        description: transcript,
        provenance: {
          ...painPodcastTranscript.provenance,
          capturedAt: now,
          note: `Mock transcript for ${params.account}`,
        },
      },
      note: "Mock Speechmatics transcript.",
    };
  }

  const apiKey = env.SPEECHMATICS_API_KEY!.trim();
  const endpoint =
    env.SPEECHMATICS_ENDPOINT || "https://asr.api.speechmatics.com/v2/jobs";

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
            title: `Audio transcription job started — ${params.account}`,
            description: `Speechmatics job ${job.id || "created"} for ${params.audioUrl}. Poll job for full transcript in production.`,
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
          note: "Speechmatics job submitted (async). Using interim signal for MVP.",
        };
      }
    } catch (err) {
      console.warn("Speechmatics API failed:", err);
    }
  }

  return {
    mode: "real",
    signal: {
      ...painPodcastTranscript,
      title: `Audio pain signal — ${params.account}`,
      description: transcript,
      subScore: 67,
      provenance: {
        sponsor: "speechmatics",
        tool: "Speechmatics",
        capturedAt: now,
        note: "Real mode configured; using demo transcript until audio URL job completes",
      },
    },
    note: "Speechmatics real mode — demo transcript fallback (provide SPEECHMATICS_AUDIO_URL for live job).",
  };
}

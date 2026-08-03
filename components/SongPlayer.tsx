"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/api";
import EqBars from "./EqBars";

export type SongData = {
  song_id: string;
  status: string;
  audio_url?: string;
  lyrics?: string;
  style_caption: string;
  duration_seconds: number;
  created_at: string;
};

type Props = {
  status: string;
  progress: number;
  errorMessage?: string;
  songData?: SongData | null;
};

const STAGE_LABEL: Record<string, string> = {
  queued: "Queued — preparing render slot",
  rendering: "Writing & structuring lyrics",
  mixing: "Synthesizing melodic tracks & mastering audio",
  done: "Track Ready",
  failed: "Generation failed",
};

export default function SongPlayer({ status, progress, errorMessage, songData }: Props) {
  const [copied, setCopied] = useState(false);

  if (status === "failed") {
    return (
      <div className="border border-red-900/50 bg-red-950/20 rounded-md p-5 font-mono text-sm text-red-300 space-y-2">
        <div className="font-semibold text-red-400">Generation Error</div>
        <div>{errorMessage || "Something went wrong during generation."}</div>
      </div>
    );
  }

  const handleCopyLyrics = () => {
    if (songData?.lyrics) {
      navigator.clipboard.writeText(songData.lyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status === "done" && songData) {
    return (
      <div className="border border-amber/30 bg-panel rounded-lg p-6 space-y-6 shadow-xl shadow-amber/5">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <EqBars active />
            <span className="font-display font-semibold text-lg text-amber">Your Track is Ready</span>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber/10 border border-amber/30 text-amber">
            {songData.duration_seconds}s • {songData.style_caption}
          </span>
        </div>

        {/* Audio Player */}
        {songData.audio_url && (
          <div className="space-y-3 bg-ink/60 border border-line p-4 rounded-md">
            <audio controls autoPlay className="w-full h-11 accent-amber" src={mediaUrl(songData.audio_url)} />
            <div className="flex justify-between items-center text-xs font-mono text-paper/60 pt-1">
              <span>Format: Stereo PCM (192kbps)</span>
              <a
                href={mediaUrl(songData.audio_url)}
                download={`song_${songData.song_id}.mp3`}
                className="px-3 py-1.5 rounded bg-amber text-ink font-semibold hover:bg-amber/90 transition-colors"
              >
                Download Audio ↓
              </a>
            </div>
          </div>
        )}

        {/* Generated Lyrics Display */}
        {songData.lyrics && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-paper/50">
                Generated Song Lyrics
              </span>
              <button
                onClick={handleCopyLyrics}
                className="text-xs font-mono px-2 py-1 rounded border border-line text-paper/70 hover:border-amber hover:text-amber transition-colors"
              >
                {copied ? "Copied! ✓" : "Copy Lyrics"}
              </button>
            </div>
            <div className="bg-ink/80 border border-line rounded-md p-4 max-h-72 overflow-y-auto font-mono text-xs leading-relaxed text-paper/90 whitespace-pre-wrap">
              {songData.lyrics}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-line bg-panel rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-amber font-semibold">
          {STAGE_LABEL[status] || "Processing track"}
        </span>
        <EqBars active />
      </div>
      <div className="h-2 bg-ink rounded-full overflow-hidden border border-line">
        <div
          className="h-full bg-gradient-to-r from-amber to-amber/70 transition-all duration-500 rounded-full"
          style={{ width: `${Math.max(progress, 8)}%` }}
        />
      </div>
      <p className="text-xs font-mono text-paper/40 text-center">
        Creating harmonies, bassline, and matching lyrics... ({progress}%)
      </p>
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type GeneratePayload = {
  mode: "custom" | "auto";
  lyrics?: string;
  theme?: string;
  style_caption: string;
  instrumental: boolean;
  duration_seconds: number;
};

export async function generateSong(payload: GeneratePayload) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Generation request failed");
  return res.json() as Promise<{ song_id: string; status: string }>;
}

export async function getStatus(songId: string) {
  const res = await fetch(`${API_BASE}/api/songs/${songId}/status`);
  if (!res.ok) throw new Error("Status check failed");
  return res.json() as Promise<{ status: string; progress: number; error_message?: string }>;
}

export async function getSong(songId: string) {
  const res = await fetch(`${API_BASE}/api/songs/${songId}`);
  if (!res.ok) throw new Error("Song fetch failed");
  return res.json();
}

export async function cloneVoice(file: File, voiceName: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("voice_name", voiceName);

  const res = await fetch(`${API_BASE}/api/voice/clone`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Voice cloning failed");
  return res.json() as Promise<{ voice_id: string; voice_name: string; message: string }>;
}

export async function getVoices() {
  const res = await fetch(`${API_BASE}/api/voices`);
  if (!res.ok) return [];
  return res.json() as Promise<{ id: string; label: string }[]>;
}

export async function uploadRvcVoiceModel(pthFile: File, singerName: string, indexFile?: File | null) {
  const formData = new FormData();
  formData.append("pth_file", pthFile);
  formData.append("singer_name", singerName);
  if (indexFile) {
    formData.append("index_file", indexFile);
  }

  const res = await fetch(`${API_BASE}/api/upload-voice`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).detail || "RVC Model Upload failed");
  return res.json() as Promise<{ voice_id: string; voice_name: string; message: string }>;
}

export function mediaUrl(path: string) {
  return `${API_BASE}${path}`;
}

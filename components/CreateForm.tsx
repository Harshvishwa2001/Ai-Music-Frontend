"use client";

import { useEffect, useRef, useState } from "react";
import { generateSong, getStatus, getSong, cloneVoice, getVoices, uploadRvcVoiceModel } from "@/lib/api";
import SongPlayer, { SongData } from "./SongPlayer";

const GENRE_CHIPS = ["Acoustic Guitar", "Romantic", "Sad Melancholic", "Bollywood", "Lo-fi", "Rock", "EDM", "Pop"];

const DEFAULT_VOICES = [
  { id: "anuv", label: "✨ Anuv Jain", desc: "Acoustic Indie RVC Model (.pth + .index)", pth: true },
  { id: "hindi_male_romantic", label: "🎤 Hindi Male (Romantic)", desc: "Soft Romantic Vocalist", pth: false },
  { id: "hindi_female_sad", label: "🎤 Hindi Female (Sad)", desc: "Melancholic Vocal Profile", pth: false },
  { id: "generic_ai", label: "🤖 Standard AI Voice", desc: "Generic AI Voice", pth: false },
];

const ANUV_HINDI_PRESET = `[Intro]
(धीमी एकोस्टिक गिटार धुन, अनवरत बहती हवा...)

[Verse 1]
बारिशों की इस शाम में,
तेरा ही नाम पुकारा।
बहती हवाओं ने भी,
तेरा ही पता बताया।

[Chorus]
अगर तुम मिल जाओ,
ज़माना छोड़ देंगे हम।
तुम्हें पाकर ज़माने से,
नाराज़ होना छोड़ देंगे हम।`;

const ROMANCE_HINDI_PRESET = `[Intro]
(धीमी गिटार धुन, बहती हवा...)

[Verse 1]
सपनों की इस दुनिया में,
तेरा ही रंग छाया।
तेरे साथ चलना ही,
मेरे दिल ने चाहा।

[Chorus]
अगर कभी दूर भी हो,
यादों में तू पास रहे।
हर दुआ में नाम तेरा,
दिल बस तुझको चाहे।`;

const SAD_HINDI_PRESET = `[Intro]
(धीमी पियानो धुन, हल्की हवा की सरसराहट...)

[Verse 1]
खामोश हैं रातें, तन्हा है दिल,
तेरी यादों से भरी है हर एक महफ़िल।
आँखों में छुपे हैं अनकहे आंसू,
कैसे कहूँ कितना मुश्किल है ये पल।

[Chorus]
टूटे हुए दिल की सदा सुन ले,
यादों के चिराग फिर से जला दे।
तू दूर सही पर दिल के पास है,
इस तन्हाई में भी तेरी ही तलाश है।`;

const LYRICS_PLACEHOLDER = `[Verse 1]
Walking down an empty street tonight
City lights are burning way too bright

[Chorus]
And I don't wanna go, I don't wanna go
Not until the sun comes up slow`;

export default function CreateForm() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<"custom" | "auto">("custom");
  const [lyrics, setLyrics] = useState("");
  const [theme, setTheme] = useState("");
  const [styleText, setStyleText] = useState("acoustic guitar romantic indie pop 76bpm");
  const [genre, setGenre] = useState<string | null>("Acoustic Guitar");
  const [instrumental, setInstrumental] = useState(false);
  const [duration, setDuration] = useState(30);

  const [voiceModel, setVoiceModel] = useState("anuv");
  const [voiceList, setVoiceList] = useState<{ id: string; label: string; desc?: string; pth?: boolean }[]>(DEFAULT_VOICES);
  const [voiceTab, setVoiceTab] = useState<"preset" | "upload" | "clone">("preset");

  // RVC Upload state
  const [rvcSingerName, setRvcSingerName] = useState("");
  const [rvcPthFile, setRvcPthFile] = useState<File | null>(null);
  const [rvcIndexFile, setRvcIndexFile] = useState<File | null>(null);
  const [rvcUploadStatus, setRvcUploadStatus] = useState<string | null>(null);
  const [isUploadingRvc, setIsUploadingRvc] = useState(false);

  // Voice Clone state
  const [userVoiceName, setUserVoiceName] = useState("");
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [cloneStatus, setCloneStatus] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  // Song Generation state
  const [songId, setSongId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [songData, setSongData] = useState<SongData | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshVoices = async () => {
    try {
      const serverVoices = await getVoices();
      if (serverVoices && serverVoices.length > 0) {
        const merged = serverVoices.map((v) => ({
          id: v.id,
          label: v.label,
          desc: v.id === "anuv" ? "Applio RVC (.pth + .index Active)" : "Applio Voice Model",
          pth: true,
        }));
        setVoiceList(merged);
      }
    } catch (e) {
      console.error("Failed to fetch voices:", e);
    }
  };

  useEffect(() => {
    refreshVoices();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleUploadRvcModel = async () => {
    if (!rvcPthFile || !rvcSingerName.trim()) return;
    setIsUploadingRvc(true);
    setRvcUploadStatus(null);
    try {
      const res = await uploadRvcVoiceModel(rvcPthFile, rvcSingerName.trim(), rvcIndexFile);
      setRvcUploadStatus(`✓ ${res.message}`);
      setRvcSingerName("");
      setRvcPthFile(null);
      setRvcIndexFile(null);
      await refreshVoices();
      setVoiceModel(res.voice_id);
      setVoiceTab("preset");
    } catch (err) {
      setRvcUploadStatus(err instanceof Error ? `❌ ${err.message}` : "❌ RVC upload failed");
    } finally {
      setIsUploadingRvc(false);
    }
  };

  const handleCloneVoice = async () => {
    if (!voiceFile || !userVoiceName.trim()) return;
    setIsCloning(true);
    setCloneStatus(null);
    try {
      const res = await cloneVoice(voiceFile, userVoiceName.trim());
      setCloneStatus(`✓ ${res.message}`);
      setUserVoiceName("");
      setVoiceFile(null);
      await refreshVoices();
      setVoiceModel(res.voice_id);
      setVoiceTab("preset");
    } catch (err) {
      setCloneStatus(err instanceof Error ? `❌ ${err.message}` : "❌ Voice cloning failed");
    } finally {
      setIsCloning(false);
    }
  };

  const insertTag = (tag: string) => {
    setLyrics((prev) => (prev ? `${prev}\n\n[${tag}]\n` : `[${tag}]\n`));
  };

  const styleCaption = () => {
    const chip = genre ? `${genre.toLowerCase()}, ` : "";
    const voiceTag = voiceModel !== "generic_ai" ? `[voice:${voiceModel}] ` : "";
    return `${voiceTag}${chip}${styleText}`.trim() || genre || "acoustic guitar romantic indie pop";
  };

  const canSubmit =
    (mode === "custom" ? instrumental || lyrics.trim().length > 0 : theme.trim().length > 0) &&
    !!styleCaption();

  const loadAnuvPreset = () => {
    setMode("custom");
    setLyrics(ANUV_HINDI_PRESET);
    setGenre("Acoustic Guitar");
    setVoiceModel("anuv");
    setStyleText("anuv jain style romantic acoustic guitar indie vocals 76bpm");
    setInstrumental(false);
  };

  const loadRomancePreset = () => {
    setMode("custom");
    setLyrics(ROMANCE_HINDI_PRESET);
    setGenre("Bollywood");
    setVoiceModel("hindi_male_romantic");
    setStyleText("romantic acoustic guitar slow romantic male vocals");
    setInstrumental(false);
  };

  const loadSadPreset = () => {
    setMode("custom");
    setLyrics(SAD_HINDI_PRESET);
    setGenre("Sad Melancholic");
    setVoiceModel("hindi_female_sad");
    setStyleText("sad emotional melancholic piano slow 75bpm soft vocals");
    setInstrumental(false);
  };

  async function handleGenerate() {
    setSubmitError(null);
    setSongData(null);
    try {
      const { song_id } = await generateSong({
        mode,
        lyrics: mode === "custom" ? lyrics : undefined,
        theme: mode === "auto" ? theme : undefined,
        style_caption: styleCaption(),
        instrumental,
        duration_seconds: duration,
      });
      setSongId(song_id);
      setStatus("queued");
      setProgress(10);

      pollRef.current = setInterval(async () => {
        try {
          const s = await getStatus(song_id);
          setStatus(s.status);
          setProgress(s.progress);
          setErrorMessage(s.error_message);

          if (s.status === "done") {
            const data = await getSong(song_id);
            setSongData(data);
            if (pollRef.current) clearInterval(pollRef.current);
          }
          if (s.status === "failed" && pollRef.current) {
            clearInterval(pollRef.current);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 1500);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to start generation");
    }
  }

  const activeVoiceLabel = voiceList.find((v) => v.id === voiceModel)?.label || voiceModel;

  return (
    <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
      {/* Left Column: 3-Step Creation Form */}
      <div className="space-y-6 bg-panel/70 border border-line p-6 md:p-8 rounded-xl shadow-2xl backdrop-blur-md">
        
        {/* Step Indicator Header */}
        <div className="grid grid-cols-3 gap-2 border-b border-line pb-5">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2 font-mono text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
              activeStep === 1
                ? "bg-amber text-ink shadow-md shadow-amber/20"
                : "bg-ink/50 text-paper/60 hover:text-paper border border-line"
            }`}
          >
            <span>1.</span>
            <span>📝 Lyrics</span>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`flex items-center gap-2 font-mono text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
              activeStep === 2
                ? "bg-amber text-ink shadow-md shadow-amber/20"
                : "bg-ink/50 text-paper/60 hover:text-paper border border-line"
            }`}
          >
            <span>2.</span>
            <span>🎙️ Select Voice</span>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`flex items-center gap-2 font-mono text-xs font-semibold py-2 px-3 rounded-lg transition-all ${
              activeStep === 3
                ? "bg-amber text-ink shadow-md shadow-amber/20"
                : "bg-ink/50 text-paper/60 hover:text-paper border border-line"
            }`}
          >
            <span>3.</span>
            <span>🎵 Style & Render</span>
          </button>
        </div>

        {/* STEP 1: LYRICS & SONG STRUCTURE */}
        {activeStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1 p-1 bg-ink border border-line rounded-lg font-mono text-xs">
                {(["custom", "auto"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      mode === m ? "bg-amber text-ink font-semibold" : "text-paper/60 hover:text-paper"
                    }`}
                  >
                    {m === "custom" ? "Write My Own Lyrics" : "Auto-AI Prompt Lyrics"}
                  </button>
                ))}
              </div>

              {/* Quick Presets */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={loadAnuvPreset}
                  className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  ✨ Anuv Preset
                </button>
                <button
                  onClick={loadRomancePreset}
                  className="text-xs font-mono px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors"
                >
                  ❤️ Romance Preset
                </button>
                <button
                  onClick={loadSadPreset}
                  className="text-xs font-mono px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition-colors"
                >
                  💔 Sad Preset
                </button>
              </div>
            </div>

            {mode === "custom" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs uppercase tracking-wider text-amber font-semibold">
                    Song Lyrics
                  </label>
                  <div className="flex gap-1">
                    {["Verse", "Chorus", "Bridge", "Outro"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertTag(tag)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink border border-line text-paper/60 hover:border-amber/50 hover:text-amber transition-colors"
                      >
                        + [{tag}]
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  disabled={instrumental}
                  placeholder={LYRICS_PLACEHOLDER}
                  rows={10}
                  className="w-full bg-ink/90 border border-line rounded-lg p-4 font-mono text-sm leading-relaxed text-paper placeholder:text-paper/20 focus:outline-none focus:border-amber disabled:opacity-40 resize-none shadow-inner"
                />
                <p className="text-xs text-paper/40 font-mono">
                  💡 Tip: Use <span className="text-amber">[Verse]</span> and <span className="text-amber">[Chorus]</span> to structure song sections.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wider text-amber font-semibold">
                  Theme / Topic for AI Lyrics
                </label>
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. A romantic song about walking under rain in Mumbai, sapno ki duniya, dil ki baatein"
                  rows={6}
                  className="w-full bg-ink/90 border border-line rounded-lg p-4 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-amber resize-none"
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveStep(2)}
                className="bg-amber text-ink font-semibold font-mono text-xs px-5 py-2.5 rounded-lg hover:bg-amber/90 transition-colors shadow-md shadow-amber/20"
              >
                Next: Select Singer Voice →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VOICE MODEL SELECTOR & APPLIO MODEL UPLOADER */}
        {activeStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            {/* Active Voice Summary Card */}
            <div className="border border-amber/40 bg-amber/10 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber">Active Singer Voice</span>
                <div className="font-display font-semibold text-base text-paper">{activeVoiceLabel}</div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber/20 text-amber border border-amber/40">
                Applio RVC Enabled
              </span>
            </div>

            {/* Voice Tabs */}
            <div className="flex border-b border-line font-mono text-xs">
              <button
                type="button"
                onClick={() => setVoiceTab("preset")}
                className={`py-2 px-4 border-b-2 font-semibold transition-colors ${
                  voiceTab === "preset" ? "border-amber text-amber" : "border-transparent text-paper/50 hover:text-paper"
                }`}
              >
                🎤 Preset Voices
              </button>
              <button
                type="button"
                onClick={() => setVoiceTab("upload")}
                className={`py-2 px-4 border-b-2 font-semibold transition-colors ${
                  voiceTab === "upload" ? "border-amber text-amber" : "border-transparent text-paper/50 hover:text-paper"
                }`}
              >
                📦 Upload RVC Model (.pth + .index)
              </button>
              <button
                type="button"
                onClick={() => setVoiceTab("clone")}
                className={`py-2 px-4 border-b-2 font-semibold transition-colors ${
                  voiceTab === "clone" ? "border-amber text-amber" : "border-transparent text-paper/50 hover:text-paper"
                }`}
              >
                🎙️ Clone Voice Audio
              </button>
            </div>

            {/* TAB A: PRESET VOICES */}
            {voiceTab === "preset" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {voiceList.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVoiceModel(v.id)}
                    className={`p-3.5 rounded-lg border text-left transition-all relative ${
                      voiceModel === v.id
                        ? "bg-amber/20 border-amber text-amber shadow-md shadow-amber/10"
                        : "bg-ink/60 border-line text-paper/70 hover:border-amber/50 hover:text-paper"
                    }`}
                  >
                    <div className="font-semibold text-sm">{v.label}</div>
                    <div className="text-[11px] font-mono text-paper/40 mt-1">{v.desc || "Applio RVC Voice Profile"}</div>
                    {voiceModel === v.id && (
                      <span className="absolute top-2 right-2 text-amber text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* TAB B: UPLOAD RVC SINGER MODEL (.pth + .index) */}
            {voiceTab === "upload" && (
              <div className="border border-amber/30 bg-ink/70 rounded-lg p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-amber font-semibold">
                    Add New Singer RVC Voice Model
                  </h4>
                  <p className="text-xs text-paper/50">
                    Upload Applio RVC trained model weights (<span className="text-amber font-mono">.pth</span>) and pitch index (<span className="text-amber font-mono">.index</span>). Saved to <span className="font-mono text-paper/70">backend/models/&lt;singer&gt;/</span>.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-paper/60 mb-1">Singer Name</label>
                    <input
                      type="text"
                      value={rvcSingerName}
                      onChange={(e) => setRvcSingerName(e.target.value)}
                      placeholder="e.g. Arijit Singh / Atif Aslam"
                      className="w-full bg-panel border border-line rounded-md px-3 py-2 text-xs text-paper placeholder:text-paper/30 focus:outline-none focus:border-amber"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-paper/60 mb-1">Voice Weights (.pth) *</label>
                      <input
                        type="file"
                        accept=".pth"
                        onChange={(e) => setRvcPthFile(e.target.files?.[0] || null)}
                        className="w-full bg-panel border border-line rounded-md p-1.5 text-xs text-paper/70 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-amber/20 file:text-amber"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-paper/60 mb-1">Pitch Index (.index) [Recommended]</label>
                      <input
                        type="file"
                        accept=".index"
                        onChange={(e) => setRvcIndexFile(e.target.files?.[0] || null)}
                        className="w-full bg-panel border border-line rounded-md p-1.5 text-xs text-paper/70 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-amber/20 file:text-amber"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleUploadRvcModel}
                    disabled={!rvcPthFile || !rvcSingerName.trim() || isUploadingRvc}
                    className="w-full bg-amber text-ink font-semibold font-mono text-xs py-2.5 rounded-md hover:bg-amber/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-amber/10"
                  >
                    {isUploadingRvc ? "Saving Model to models/ Folder..." : "✦ Save RVC Model & Select Singer"}
                  </button>
                  {rvcUploadStatus && <p className="text-xs font-mono text-amber">{rvcUploadStatus}</p>}
                </div>
              </div>
            )}

            {/* TAB C: CLONE VOICE SAMPLE */}
            {voiceTab === "clone" && (
              <div className="border border-line bg-ink/70 rounded-lg p-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-amber font-semibold">
                    Clone Voice Audio Sample
                  </h4>
                  <p className="text-xs text-paper/50">
                    Upload a 10-20 second audio recording of your voice to generate a voice profile.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={userVoiceName}
                    onChange={(e) => setUserVoiceName(e.target.value)}
                    placeholder="My Voice Name (e.g. Rahul)"
                    className="w-full bg-panel border border-line rounded-md px-3 py-2 text-xs text-paper placeholder:text-paper/30 focus:outline-none focus:border-amber"
                  />

                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setVoiceFile(e.target.files?.[0] || null)}
                    className="w-full bg-panel border border-line rounded-md p-1.5 text-xs text-paper/70 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-amber/20 file:text-amber"
                  />

                  <button
                    type="button"
                    onClick={handleCloneVoice}
                    disabled={!voiceFile || !userVoiceName.trim() || isCloning}
                    className="w-full bg-amber/20 border border-amber/50 text-amber font-mono text-xs py-2.5 rounded-md hover:bg-amber/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isCloning ? "Analyzing Timbre Features..." : "✦ Extract Timbre & Clone Voice"}
                  </button>
                  {cloneStatus && <p className="text-xs font-mono text-amber">{cloneStatus}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="bg-ink border border-line text-paper/70 font-mono text-xs px-4 py-2 rounded-lg hover:text-paper transition-colors"
              >
                ← Back: Lyrics
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="bg-amber text-ink font-semibold font-mono text-xs px-5 py-2 rounded-lg hover:bg-amber/90 transition-colors shadow-md shadow-amber/20"
              >
                Next: Style & Render →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: STYLE, DURATION & AUDIO RENDER */}
        {activeStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            {/* Style Text Input */}
            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-wider text-amber font-semibold">
                Music Style & Instrumentation Prompt
              </label>
              <input
                value={styleText}
                onChange={(e) => setStyleText(e.target.value)}
                placeholder="e.g. warm indie folk, acoustic guitar, romantic slow 80bpm"
                className="w-full bg-ink/90 border border-line rounded-lg p-3 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-amber"
              />

              {/* Genre Chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {GENRE_CHIPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setGenre(genre === g ? null : g);
                      if (genre !== g) {
                        setStyleText(`${g.toLowerCase()} style romantic guitar indie pop`);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                      genre === g
                        ? "bg-amber border-amber text-ink font-semibold shadow-md shadow-amber/10"
                        : "border-line bg-ink/40 text-paper/60 hover:border-amber/50 hover:text-paper"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Vocal vs Instrumental Switch */}
            <div className="flex items-center justify-between border border-line bg-ink/60 rounded-lg p-3.5">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-paper">Instrumental Track Only</div>
                <div className="text-xs text-paper/40 font-mono">Render guitar & backing music without singer vocals</div>
              </div>
              <button
                type="button"
                onClick={() => setInstrumental(!instrumental)}
                className={`w-11 h-6 rounded-full relative transition-colors ${instrumental ? "bg-amber" : "bg-line"}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-ink transition-transform ${
                    instrumental ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Track Duration Slider */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-xs uppercase tracking-wider text-paper/60">
                <span>Track Duration</span>
                <span className="text-amber font-semibold">{duration} seconds</span>
              </div>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-amber bg-ink cursor-pointer"
              />
            </div>

            {/* Summary Bar */}
            <div className="border border-line bg-ink/40 p-3 rounded-lg font-mono text-xs space-y-1">
              <div className="text-paper/40 uppercase text-[10px]">Configured Prompt</div>
              <div className="text-amber truncate">{styleCaption()}</div>
            </div>

            {/* Generate Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canSubmit || status === "queued" || status === "rendering" || status === "mixing"}
                className="w-full bg-amber hover:bg-amber/90 disabled:opacity-30 disabled:cursor-not-allowed text-ink font-display font-semibold text-lg py-4 rounded-lg transition-all shadow-xl shadow-amber/20 flex items-center justify-center gap-2"
              >
                {status === "queued" || status === "rendering" || status === "mixing" ? (
                  <>
                    <span className="animate-spin text-xl">⏳</span>
                    <span>Rendering AI Song Track...</span>
                  </>
                ) : (
                  <>
                    <span>✦ Generate AI Song</span>
                  </>
                )}
              </button>
              {submitError && <p className="text-xs text-red-400 font-mono mt-2">{submitError}</p>}
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="bg-ink border border-line text-paper/70 font-mono text-xs px-4 py-2 rounded-lg hover:text-paper transition-colors"
              >
                ← Back: Voice Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Audio Output Player & Preview */}
      <div className="space-y-6">
        <div className="border border-line bg-panel/70 p-6 rounded-xl space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-amber font-semibold">
              Track Output & Live Preview
            </h3>
            <span className="text-[10px] font-mono text-paper/40">Suno-Style AI Render</span>
          </div>

          {songId ? (
            <SongPlayer status={status} progress={progress} errorMessage={errorMessage} songData={songData} />
          ) : (
            <div className="border border-dashed border-line/60 rounded-xl p-12 text-center text-paper/30 text-xs font-mono space-y-3 bg-ink/40">
              <div className="text-3xl animate-bounce">🎵</div>
              <div className="font-semibold text-paper/50 text-sm">Your Track will appear here</div>
              <p className="text-[11px] text-paper/30 max-w-xs mx-auto">
                Write lyrics, pick your singer voice model, and click Generate to create a custom track.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


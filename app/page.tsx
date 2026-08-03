import CreateForm from "@/components/CreateForm";
import EqBars from "@/components/EqBars";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-ink px-4 py-8 md:px-12 lg:px-16 text-paper">
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between border-b border-line/60 pb-5">
        <div className="flex items-center gap-3">
          <EqBars active />
          <span className="font-display text-2xl font-bold tracking-tight text-amber">Suno AI Studio</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber/10 text-amber border border-amber/30">
            Applio RVC Voice Engine
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-xs text-paper/60 uppercase tracking-wider">
            Local Render · PyTorch & RVC v2
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mb-8 space-y-2">
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight tracking-tight">
          Write Your Lyrics. <span className="text-amber">Sing in Any Voice.</span>
        </h1>
        <p className="text-paper/60 max-w-xl text-sm leading-relaxed font-body">
          Enter song lyrics, choose or upload an Applio RVC singer model (<code className="text-amber font-mono text-xs">.pth</code> + <code className="text-amber font-mono text-xs">.index</code>), and generate a full studio song with real acoustic guitars & backing music.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <CreateForm />
      </div>
    </main>
  );
}


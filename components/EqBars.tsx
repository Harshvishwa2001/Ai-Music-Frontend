"use client";

export default function EqBars({ active = false }: { active?: boolean }) {
  const heights = [40, 70, 100, 55, 85, 35, 65];
  return (
    <div className="flex items-end gap-[3px] h-6">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${active ? "bg-signal" : "bg-line"}`}
          style={{
            height: `${h}%`,
            animation: active ? `eq 0.9s ease-in-out ${i * 0.09}s infinite alternate` : "none",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes eq {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

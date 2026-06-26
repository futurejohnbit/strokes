import React from 'react';
import { Award, Sparkles } from 'lucide-react';

export default function BadgeGallery({ worlds, selectedWorldId, onSelectWorld }) {
  return (
    <section className="home-v2-badge-wall w-full max-w-6xl rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 shadow-xl backdrop-blur-xl md:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
            <Award size={14} />
            徽章牆
          </div>
          <h2 className="text-3xl font-bold text-slate-800 font-kai">四大職業徽章</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            延續現有四個原有徽章設定，讓首頁先看見收穫與身份感。每一枚徽章都代表你完成一個職業世界的試煉。
          </p>
        </div>
        <div className="hidden rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white md:block">
          已規劃 4 / 4 枚
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {worlds.map((world) => {
          const isActive = world.id === selectedWorldId;
          return (
            <button
              key={world.id}
              type="button"
              onClick={() => onSelectWorld(world.id)}
              className={`home-v2-badge-card group rounded-[1.5rem] border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                isActive
                  ? 'border-amber-300 ring-2 ring-amber-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${world.chipClass}`}>
                  {world.radical} {world.radicalLabel}
                </span>
                <Sparkles
                  size={16}
                  className={`transition-opacity ${isActive ? 'text-amber-500 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}
                />
              </div>

              <div className="mt-4 flex items-center justify-center rounded-[1.25rem] bg-slate-50 p-4">
                <img
                  src={world.image}
                  alt={`${world.title} 徽章`}
                  className="h-28 w-28 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="mt-4">
                <div className="text-lg font-bold text-slate-800 font-kai">{world.title}</div>
                <div className="mt-1 text-sm text-slate-500">{world.badgeTitle}</div>
                <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  解鎖條件：完成 {world.title} 後獲得專屬徽章，並點亮狀元帽的一個關鍵配件。
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

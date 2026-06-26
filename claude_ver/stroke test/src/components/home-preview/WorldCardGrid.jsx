import React from 'react';
import { ArrowRight, Eye, Hammer, Flame, Sprout, ScrollText } from 'lucide-react';

const iconMap = {
  wood: Hammer,
  grain: Sprout,
  fire: Flame,
  speech: ScrollText,
};

export default function WorldCardGrid({
  worlds,
  selectedWorldId,
  onSelectWorld,
  onTryDemo,
  onGoHome,
}) {
  return (
    <section className="w-full max-w-6xl">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-white">
            四大職業試煉
          </div>
          <h2 className="text-3xl font-bold text-slate-800 font-kai">先看試煉世界，再決定先去哪裡歷練</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            新版首頁會先讓使用者看見每個世界的主題、工具、掉落配件與最終目標，而不是一打開就只看到連接藍牙。
          </p>
        </div>
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
        >
          返回正式首頁
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="home-v2-world-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {worlds.map((world) => {
          const WorldIcon = iconMap[world.id] || Hammer;
          const isActive = world.id === selectedWorldId;
          return (
            <article
              key={world.id}
              className={`home-v2-world-card overflow-hidden rounded-[1.75rem] border bg-white shadow-md transition-all ${
                isActive ? 'border-amber-300 ring-2 ring-amber-200' : 'border-white/70'
              }`}
            >
              <div
                className="relative h-48 overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.6)), url(${world.background})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-slate-700 backdrop-blur">
                  {world.radical} / {world.radicalLabel}
                </div>
                <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${world.chipClass}`}>
                  {world.tool}
                </div>
                <img
                  src={world.image}
                  alt={world.title}
                  className="absolute bottom-0 right-4 h-36 w-36 object-contain drop-shadow-2xl"
                />
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 font-kai">{world.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{world.description}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${world.softClass}`}>
                    <WorldIcon size={18} className={world.iconClass} />
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600">
                    本關物件：<span className="font-bold text-slate-800">{world.objectLabel}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600">
                    掉落配件：<span className="font-bold text-slate-800">{world.rewardLabel}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600">
                    最終貢獻：<span className="font-bold text-slate-800">{world.crownContribution}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectWorld(world.id);
                      onTryDemo();
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
                  >
                    <Eye size={16} />
                    看示範
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectWorld(world.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
                  >
                    選定世界
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

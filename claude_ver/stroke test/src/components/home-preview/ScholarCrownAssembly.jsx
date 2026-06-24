import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Crown, Sparkles } from 'lucide-react';

export default function ScholarCrownAssembly({ worlds, selectedWorldId }) {
  const crownRef = useRef(null);
  const piecesRef = useRef([]);
  const crownGlowRef = useRef(null);
  const crownFinalRef = useRef(null);

  useEffect(() => {
    const activeIndex = worlds.findIndex((world) => world.id === selectedWorldId);
    if (activeIndex < 0) return undefined;

    const pieceNodes = piecesRef.current.filter(Boolean);
    const ctx = gsap.context(() => {
      gsap.set(pieceNodes, { clearProps: 'all' });
      gsap.set(crownGlowRef.current, { autoAlpha: 0, scale: 0.7 });
      gsap.set(crownFinalRef.current, { autoAlpha: 0.85, scale: 0.94, y: 16 });

      const timeline = gsap.timeline();
      pieceNodes.forEach((node, index) => {
        const offsetX = index < 2 ? -100 + index * 42 : 100 - (index - 2) * 42;
        const offsetY = index === 3 ? -88 : 72 - index * 10;
        timeline.fromTo(
          node,
          {
            x: offsetX,
            y: offsetY,
            scale: 0.75,
            autoAlpha: index === activeIndex ? 1 : 0.6,
            rotate: index % 2 === 0 ? -12 : 12,
          },
          {
            x: 0,
            y: 0,
            scale: index === activeIndex ? 1.12 : 1,
            autoAlpha: 1,
            rotate: 0,
            duration: 0.5,
            ease: 'back.out(1.5)',
          },
          index * 0.18
        );
      });

      timeline
        .to(
          crownGlowRef.current,
          {
            autoAlpha: 1,
            scale: 1.35,
            duration: 0.42,
            ease: 'power2.out',
          },
          '>-0.05'
        )
        .to(
          crownFinalRef.current,
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.58,
            ease: 'back.out(1.8)',
          },
          '<'
        )
        .to(
          crownGlowRef.current,
          {
            autoAlpha: 0,
            scale: 1.75,
            duration: 0.36,
            ease: 'power2.out',
          },
          '>-0.12'
        );
    }, crownRef);

    return () => ctx.revert();
  }, [selectedWorldId]);

  return (
    <section className="w-full max-w-6xl rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 shadow-xl backdrop-blur-xl md:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-indigo-700">
            <Crown size={14} />
            終局收集線
          </div>
          <h2 className="text-3xl font-bold text-slate-800 font-kai">四關材料，最後整合成狀元冠帽</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            首頁預覽不只展示「有四關」，還要把整體收集邏輯講清楚。每畫一筆，當前世界的物件會完成更多一點；每通一關，再額外掉落一件能拼進狀元冠帽的核心配件。
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg">
          目標：集齊四界配件，點亮小小狀元身份
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {worlds.map((world, index) => {
            const isActive = world.id === selectedWorldId;
            return (
              <article
                key={world.id}
                className={`home-v2-assembly-card rounded-[1.5rem] border p-5 transition-all ${
                  isActive
                    ? 'border-amber-300 bg-amber-50/90 shadow-lg'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${world.chipClass}`}>
                      第 {index + 1} 關
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-800 font-kai">{world.title}</h3>
                  </div>
                  <img src={world.image} alt={world.title} className="h-16 w-16 object-contain" />
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-600">
                    關卡物件：<span className="font-bold text-slate-800">{world.objectLabel}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-600">
                    掉落材料：<span className="font-bold text-slate-800">{world.rewardLabel}</span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-600">
                    冠帽貢獻：<span className="font-bold text-slate-800">{world.crownContribution}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.28),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(96,165,250,0.18),_transparent_36%)]" />
          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3 text-amber-300">
                <Crown size={24} />
              </div>
              <div>
                <div className="text-lg font-bold">狀元冠帽裝配台</div>
                <div className="text-sm text-slate-300">各界材料將在這裡完成整合</div>
              </div>
            </div>

            <div ref={crownRef} className="home-v2-crown-stage relative mx-auto my-4 h-72 w-full max-w-sm">
              <div className="home-v2-crown-base absolute bottom-8 left-1/2 h-16 w-48 -translate-x-1/2 rounded-[999px] bg-gradient-to-b from-amber-200 to-amber-500 shadow-[0_12px_30px_rgba(251,191,36,0.45)]" />
              <div className="home-v2-crown-bridge absolute bottom-24 left-1/2 h-16 w-56 -translate-x-1/2 rounded-t-[999px] border-[10px] border-amber-300 border-b-0 bg-transparent" />
              <div ref={crownGlowRef} className="absolute left-1/2 top-20 h-28 w-28 -translate-x-1/2 rounded-full bg-amber-200/50 opacity-0 blur-2xl" />

              <div
                data-piece="wood"
                ref={(node) => {
                  piecesRef.current[0] = node;
                }}
                className={`home-v2-crown-piece absolute bottom-24 left-9 rounded-2xl px-4 py-3 text-xs font-bold shadow-lg transition-all ${
                  selectedWorldId === 'wood' ? 'bg-amber-200 text-amber-900' : 'bg-white/90 text-slate-800'
                }`}
              >
                木框骨架
              </div>
              <div
                data-piece="grain"
                ref={(node) => {
                  piecesRef.current[1] = node;
                }}
                className={`home-v2-crown-piece absolute bottom-20 left-1/2 -translate-x-1/2 rounded-2xl px-4 py-3 text-xs font-bold shadow-lg transition-all ${
                  selectedWorldId === 'grain' ? 'bg-lime-200 text-lime-900' : 'bg-white/90 text-slate-800'
                }`}
              >
                金穗流蘇
              </div>
              <div
                data-piece="fire"
                ref={(node) => {
                  piecesRef.current[2] = node;
                }}
                className={`home-v2-crown-piece absolute bottom-24 right-9 rounded-2xl px-4 py-3 text-xs font-bold shadow-lg transition-all ${
                  selectedWorldId === 'fire' ? 'bg-rose-200 text-rose-900' : 'bg-white/90 text-slate-800'
                }`}
              >
                火紋金飾
              </div>
              <div
                data-piece="speech"
                ref={(node) => {
                  piecesRef.current[3] = node;
                }}
                className={`home-v2-crown-piece absolute left-1/2 top-8 -translate-x-1/2 rounded-2xl px-4 py-3 text-xs font-bold shadow-lg transition-all ${
                  selectedWorldId === 'speech' ? 'bg-indigo-200 text-indigo-900' : 'bg-white/90 text-slate-800'
                }`}
              >
                題字冠牌
              </div>

              <div ref={crownFinalRef} className="absolute left-1/2 top-20 -translate-x-1/2 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-amber-300 ring-1 ring-white/20">
                  <Sparkles size={24} />
                </div>
                <div className="mt-3 text-sm font-bold tracking-[0.25em] text-amber-100">狀元冠帽</div>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/10 px-4 py-4 text-sm leading-6 text-slate-200 ring-1 ring-white/10">
              設定摘要：玩家在四個職業世界內不只是過關，而是在「做工、收料、組裝」，最後把四界的技能與成果戴到頭上，正式成為小小狀元。
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight, Bluetooth, Crown, Flame, Hammer, PenTool, ScrollText, Sparkles, Sprout, Wand2 } from 'lucide-react';
import BadgeGallery from './components/home-preview/BadgeGallery';
import PreviewDemoStage from './components/home-preview/PreviewDemoStage';
import ScholarCrownAssembly from './components/home-preview/ScholarCrownAssembly';
import WorldCardGrid from './components/home-preview/WorldCardGrid';
import { EXHIBITION_STEPS, HOME_V2_WORLDS } from './data/exhibitionWorlds';

gsap.registerPlugin(ScrollTrigger);

const HERO_ICONS = {
  wood: Hammer,
  grain: Sprout,
  fire: Flame,
  speech: ScrollText,
};

function splitTitle(text) {
  return text.split('').map((char, index) => (
    <span key={`${char}-${index}`} className="inline-block">
      {char}
    </span>
  ));
}

export default function HomePreviewV2({ navigate, onPulseSfx }) {
  const [selectedWorldId, setSelectedWorldId] = useState('wood');

  const rootRef = useRef(null);

  const selectedWorld = useMemo(
    () => HOME_V2_WORLDS.find((world) => world.id === selectedWorldId) || HOME_V2_WORLDS[0],
    [selectedWorldId]
  );

  const scrollToId = useCallback((id) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const routeTo = useCallback(
    (path, tone = 'step') => {
      onPulseSfx?.(tone);
      navigate(path);
    },
    [navigate, onPulseSfx]
  );

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.home-v2-float', {
        y: -12,
        x: 8,
        duration: 3.2,
        stagger: 0.25,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTimeline
        .from('.home-v2-hero-badge', { y: 20, autoAlpha: 0, duration: 0.45 })
        .from('.home-v2-hero-line', { y: 60, autoAlpha: 0, stagger: 0.08, duration: 0.7 }, '-=0.1')
        .from('.home-v2-hero-copy', { y: 28, autoAlpha: 0, stagger: 0.1, duration: 0.6 }, '-=0.35')
        .from('.home-v2-hero-button', { y: 18, autoAlpha: 0, stagger: 0.08, duration: 0.45 }, '-=0.3')
        .from('.home-v2-hero-figure', { x: 40, autoAlpha: 0, stagger: 0.08, duration: 0.55 }, '-=0.45')
        .from('.home-v2-hero-summary', { y: 18, autoAlpha: 0, duration: 0.45 }, '-=0.3');

      gsap.utils.toArray('.home-v2-section-shell').forEach((section) => {
        gsap.from(section, {
          y: 64,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            once: true,
          },
        });
      });

      gsap.from('.home-v2-world-card', {
        y: 50,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.home-v2-world-grid',
          start: 'top 82%',
          once: true,
        },
      });

      gsap.from('.home-v2-badge-card', {
        y: 44,
        autoAlpha: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.home-v2-badge-wall',
          start: 'top 82%',
          once: true,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="home-v2-root min-h-screen bg-amber-50 text-slate-800"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="home-v2-float home-v2-orb left-[8%] top-[15%] h-28 w-28 bg-amber-300/25" />
        <div className="home-v2-float home-v2-orb left-[76%] top-[12%] h-36 w-36 bg-indigo-300/20" />
        <div className="home-v2-float home-v2-orb left-[10%] top-[68%] h-40 w-40 bg-emerald-300/20" />
        <div className="home-v2-float home-v2-orb left-[82%] top-[70%] h-28 w-28 bg-rose-300/20" />
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 md:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-black text-white shadow-lg">狀元</div>
          <div>
            <div className="text-xl font-bold text-slate-800 font-kai">行行出狀元</div>
            <div className="text-xs tracking-[0.25em] text-slate-400">HOME V2 PREVIEW</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => routeTo('/')}
          className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow"
        >
          返回短首頁
          <ArrowRight size={16} />
        </button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 md:px-6">
        <section className="home-v2-hero section-shell grid min-h-[78vh] items-center gap-8 rounded-[2.5rem] border border-white/70 bg-white/75 px-6 py-10 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="space-y-6">
            <div className="home-v2-hero-badge inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
              <Sparkles size={16} />
              介紹頁
            </div>

            <div className="space-y-3">
              <h1 className="home-v2-hero-line home-v2-hero-title text-5xl font-black leading-tight text-slate-900 md:text-6xl font-kai">
                {splitTitle('四大職業試煉')}
              </h1>
              <h1 className="home-v2-hero-line home-v2-hero-title text-5xl font-black leading-tight text-slate-900 md:text-6xl font-kai">
                {splitTitle('如何合成狀元帽')}
              </h1>
            </div>

            <p className="home-v2-hero-copy max-w-2xl text-lg leading-8 text-slate-600">
              介紹頁承接展覽短首頁沒有展開的內容：四界角色怎樣試煉、每關會完成什麼物件、如何掉落配件，以及最後如何把全部成果組裝成狀元帽。
            </p>

            <div className="home-v2-hero-copy grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                <div className="text-sm font-bold text-slate-800">卡通片式動作</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">
                  每個世界都用角色或工具持續動作帶動畫面，而不是只讓卡片閃爍。
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                <div className="text-sm font-bold text-slate-800">完成與合成回饋</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">
                  單一物件完成時先閃光再彈出落定，最終再把四界配件集中組裝。
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => routeTo('/game', 'reward')}
                className="home-v2-hero-button inline-flex items-center gap-3 rounded-full bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-xl transition hover:-translate-y-1"
              >
                <Bluetooth size={18} />
                直接開始體驗
              </button>
              <button
                type="button"
                onClick={() => {
                  onPulseSfx?.('step');
                  scrollToId('home-v2-demo');
                }}
                className="home-v2-hero-button inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 shadow-sm transition hover:-translate-y-1"
              >
                <Wand2 size={18} />
                看卡通示範
              </button>
              <button
                type="button"
                onClick={() => routeTo('/writing-test')}
                className="home-v2-hero-button inline-flex items-center gap-2 rounded-full border border-transparent bg-indigo-100 px-6 py-4 text-base font-bold text-indigo-800 transition hover:-translate-y-1"
              >
                <PenTool size={18} />
                書寫測試頁
              </button>
            </div>

            <div className="home-v2-hero-summary rounded-[1.75rem] bg-slate-950 px-5 py-5 text-white shadow-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-amber-200">
                <Crown size={14} />
                一句話定位
              </div>
              <div className="text-lg font-bold leading-8">
                短首頁負責一眼看懂，介紹頁負責把試煉、徽章、收集與合成一次講完整。
              </div>
            </div>
          </div>

          <div className="relative min-h-[30rem]">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-2xl" />
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.16),_transparent_28%)]" />

            <div className="relative flex h-full flex-col justify-between p-6">
              <div className="grid grid-cols-2 gap-3">
                {HOME_V2_WORLDS.map((world) => {
                  const HeroIcon = HERO_ICONS[world.id] || Hammer;
                  return (
                    <button
                      key={world.id}
                      type="button"
                      onClick={() => {
                        setSelectedWorldId(world.id);
                        onPulseSfx?.('step');
                      }}
                      className={`home-v2-hero-figure rounded-[1.5rem] border p-4 text-left backdrop-blur transition ${
                        world.id === selectedWorldId
                          ? 'border-amber-300 bg-white/18 shadow-xl'
                          : 'border-white/10 bg-white/8 hover:bg-white/12'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${world.chipClass}`}>
                          {world.radical}
                        </span>
                        <HeroIcon size={16} className="text-white/80" />
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-lg font-bold text-white font-kai">{world.title}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-300">{world.rewardLabel}</div>
                        </div>
                        <img src={world.image} alt={world.title} className="h-16 w-16 object-contain drop-shadow-2xl" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="home-v2-hero-figure rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="text-sm font-bold tracking-[0.25em] text-amber-200">目前聚焦世界</div>
                  <div className="mt-3 text-3xl font-black text-white font-kai">{selectedWorld.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{selectedWorld.description}</div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    <span className={`rounded-full px-3 py-1 ${selectedWorld.chipClass}`}>{selectedWorld.objectLabel}</span>
                    <span className={`rounded-full px-3 py-1 ${selectedWorld.chipClass}`}>{selectedWorld.rewardLabel}</span>
                  </div>
                </div>

                <div className="home-v2-hero-figure flex min-w-[10rem] flex-col items-center justify-center rounded-[1.75rem] border border-amber-300/20 bg-gradient-to-b from-amber-300/20 to-amber-100/5 p-5">
                  <div className="rounded-full bg-white/10 p-4 text-amber-300">
                    <Crown size={30} />
                  </div>
                  <div className="mt-3 text-center text-sm font-bold text-amber-100">最終收藏</div>
                  <div className="mt-1 text-center text-xl font-black text-white font-kai">狀元帽</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-v2-section-shell rounded-[2rem] border border-slate-200 bg-white/85 px-6 py-8 shadow-xl backdrop-blur md:px-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-white">
                <ScrollText size={14} />
                敘事主線
              </div>
              <h2 className="text-3xl font-bold text-slate-800 font-kai">觀眾在介紹頁會依序理解的三件事</h2>
            </div>
            <button
              type="button"
              onClick={() => scrollToId('home-v2-worlds')}
              className="inline-flex items-center gap-2 self-start rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800"
            >
              看四大世界
              <ArrowDown size={16} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {EXHIBITION_STEPS.map((step, index) => (
              <article key={step.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-5 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                  {index + 1}
                </div>
                <div className="mt-4 text-xl font-bold text-slate-800">{step.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="home-v2-section-shell">
          <PreviewDemoStage world={selectedWorld} onPulseSfx={onPulseSfx} />
        </div>

        <div id="home-v2-worlds" className="home-v2-section-shell">
          <WorldCardGrid
            worlds={HOME_V2_WORLDS}
            selectedWorldId={selectedWorldId}
            onSelectWorld={setSelectedWorldId}
            onTryDemo={() => scrollToId('home-v2-demo')}
            onGoHome={() => routeTo('/')}
          />
        </div>

        <div className="home-v2-section-shell">
          <ScholarCrownAssembly worlds={HOME_V2_WORLDS} selectedWorldId={selectedWorldId} />
        </div>

        <div className="home-v2-section-shell">
          <BadgeGallery
            worlds={HOME_V2_WORLDS}
            selectedWorldId={selectedWorldId}
            onSelectWorld={setSelectedWorldId}
          />
        </div>

        <section className="home-v2-section-shell mb-8 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-950 px-6 py-8 text-white shadow-2xl md:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-amber-200">
                <Crown size={14} />
                展場導覽收尾
              </div>
              <h2 className="text-3xl font-bold font-kai">從這裡進下一步：體驗遊戲或看書寫情境</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                介紹頁已完整承接世界觀、四大職業試煉、徽章牆、完成動畫與狀元帽合成主線。接下來可直接進入正式遊戲，或打開書寫測試頁展示寫字中的即時回饋。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => routeTo('/game', 'reward')}
                className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 text-base font-bold text-slate-900 shadow-xl transition hover:-translate-y-1"
              >
                進入正式遊戲
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => routeTo('/writing-test')}
                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-6 py-4 text-base font-bold text-white transition hover:-translate-y-1"
              >
                前往書寫測試頁
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

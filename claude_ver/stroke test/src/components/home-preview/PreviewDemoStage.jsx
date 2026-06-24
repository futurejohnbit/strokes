import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { PlayCircle, Sparkles, Wand2 } from 'lucide-react';

export default function PreviewDemoStage({ world, onPulseSfx }) {
  const [completedCount, setCompletedCount] = useState(0);
  const [activeStroke, setActiveStroke] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const progressFillRef = useRef(null);
  const materialRef = useRef(null);
  const cardRef = useRef(null);
  const actorRef = useRef(null);
  const toolRef = useRef(null);
  const stageObjectRef = useRef(null);
  const flashRef = useRef(null);
  const rewardGlowRef = useRef(null);
  const partRefs = useRef([]);
  const actionTimelineRef = useRef(null);

  const totalSteps = world.demoSteps.length;
  const progressPercent = useMemo(
    () => Math.round((completedCount / totalSteps) * 100),
    [completedCount, totalSteps]
  );

  useEffect(() => {
    const timeoutIds = [];
    let cycleId;

    const runCycle = () => {
      setCompletedCount(0);
      setActiveStroke(0);
      setShowReward(false);

      world.demoSteps.forEach((_, index) => {
        timeoutIds.push(
          window.setTimeout(() => {
            setActiveStroke(index);
            setCompletedCount(index + 1);
            onPulseSfx?.('step');
          }, 300 + index * 1200)
        );
      });

      timeoutIds.push(
        window.setTimeout(() => {
          setShowReward(true);
          onPulseSfx?.('reward');
        }, 300 + world.demoSteps.length * 1200)
      );
    };

    runCycle();
    cycleId = window.setInterval(runCycle, 300 + world.demoSteps.length * 1200 + 1800);

    return () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
      window.clearInterval(cycleId);
    };
  }, [world, onPulseSfx]);

  useEffect(() => {
    actionTimelineRef.current?.kill();

    const timeline = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });
    timeline
      .to(actorRef.current, { y: -10, duration: 0.55 })
      .to(toolRef.current, { rotation: world.id === 'grain' ? -24 : -18, x: -10, y: 10, duration: 0.28 }, 0)
      .to(stageObjectRef.current, { scale: 1.04, y: -6, duration: 0.32 }, 0.08)
      .to(flashRef.current, { autoAlpha: 0.85, scale: 1.08, duration: 0.18 }, 0.12)
      .to(actorRef.current, { y: 0, duration: 0.52 })
      .to(toolRef.current, { rotation: world.id === 'speech' ? 16 : 12, x: 8, y: -4, duration: 0.34 }, 0.55)
      .to(stageObjectRef.current, { scale: 1, y: 0, duration: 0.4 }, 0.58)
      .to(flashRef.current, { autoAlpha: 0, scale: 1.35, duration: 0.34 }, 0.52);

    actionTimelineRef.current = timeline;

    return () => timeline.kill();
  }, [world.id]);

  useEffect(() => {
    if (!progressFillRef.current) return;
    gsap.to(progressFillRef.current, {
      width: `${progressPercent}%`,
      duration: 0.55,
      ease: 'power2.out',
    });
  }, [progressPercent]);

  useEffect(() => {
    const target = partRefs.current[completedCount - 1];
    if (!target) return;
    gsap.fromTo(
      target,
      { scale: 0.9, y: 8, boxShadow: '0 0 0 rgba(15,23,42,0)' },
      {
        scale: 1,
        y: 0,
        boxShadow: '0 16px 24px rgba(15,23,42,0.12)',
        duration: 0.45,
        ease: 'back.out(1.8)',
      }
    );
  }, [completedCount]);

  useEffect(() => {
    if (!showReward || !materialRef.current) return;
    gsap.fromTo(
      rewardGlowRef.current,
      { autoAlpha: 0, scale: 0.7 },
      { autoAlpha: 1, scale: 1.4, duration: 0.4, ease: 'power2.out' }
    );
    gsap.fromTo(
      materialRef.current,
      { autoAlpha: 0, scale: 0.7, y: 20, rotate: -8 },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        rotate: 0,
        duration: 0.6,
        ease: 'back.out(1.6)',
      }
    );
    gsap.fromTo(
      stageObjectRef.current,
      { boxShadow: '0 0 0 rgba(251,191,36,0)' },
      {
        boxShadow: '0 0 0 28px rgba(251,191,36,0)',
        duration: 0.8,
        ease: 'power2.out',
      }
    );
  }, [showReward]);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { autoAlpha: 0.7, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }, [world.id]);

  return (
    <section
      id="home-v2-demo"
      className="w-full max-w-6xl rounded-[2rem] border border-white/70 bg-white/80 px-6 py-8 shadow-xl backdrop-blur-xl md:px-8"
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
            <PlayCircle size={14} />
            先試玩示範
          </div>
          <h2 className="text-3xl font-bold text-slate-800 font-kai">先看 20 秒，就知道怎樣玩</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            這一區會自動循環示範：選世界、看筆劃、物件逐步完成、關卡掉落材料。首頁不用連裝置，也能先看懂玩法。
          </p>
        </div>
        <div className={`inline-flex self-start rounded-full px-4 py-2 text-sm font-bold ${world.chipClass}`}>
          目前示範：{world.title}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div ref={cardRef} className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-bold tracking-[0.25em] text-emerald-200">DEMO LOOP</div>
              <div className="mt-2 text-4xl font-bold font-kai">{world.demoChar}</div>
              <div className="mt-2 text-sm text-slate-300">
                目標物件：<span className="font-bold text-white">{world.objectLabel}</span>
              </div>
            </div>
            <img src={world.image} alt={world.title} className="h-20 w-20 object-contain drop-shadow-xl" />
          </div>

          <div className="mb-5 grid gap-4 rounded-[1.75rem] bg-white/5 p-4 ring-1 ring-white/10 md:grid-cols-[0.82fr_1.18fr]">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
              <div className="absolute inset-0 opacity-80" style={{ background: world.sceneAccent }} />
              <div ref={flashRef} className="absolute left-1/2 top-[42%] h-24 w-24 -translate-x-1/2 rounded-full bg-white/60 opacity-0 blur-xl" />
              <div className="relative z-10 flex min-h-[15rem] flex-col justify-between">
                <div className="rounded-2xl bg-white/10 px-3 py-3 text-sm leading-6 text-slate-100 backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">角色動作</div>
                  <div className="mt-2 font-bold">{world.actionVerb}</div>
                  <div className="mt-1 text-xs text-slate-300">{world.actionLoopLabel}</div>
                </div>

                <div className="relative flex items-end justify-between gap-3">
                  <img
                    ref={actorRef}
                    src={world.image}
                    alt={world.title}
                    className="h-28 w-28 object-contain drop-shadow-2xl"
                  />
                  <div className="flex-1">
                    <div
                      ref={stageObjectRef}
                      className="rounded-[1.25rem] bg-white/90 px-4 py-4 text-center text-slate-900 shadow-lg"
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">完成物件</div>
                      <div className="mt-2 font-bold">{showReward ? world.completionLabel : world.objectLabel}</div>
                    </div>
                  </div>
                  <div
                    ref={toolRef}
                    className="absolute bottom-8 left-20 h-20 w-3 rounded-full bg-gradient-to-b from-amber-200 to-amber-900 shadow-[0_0_18px_rgba(251,191,36,0.45)]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/5 p-4 ring-1 ring-white/10">
            <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
              <span>物件完成度</span>
              <span className="font-bold text-white">{progressPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div ref={progressFillRef} className={`home-v2-demo-progress h-full rounded-full bg-gradient-to-r ${world.gradientClass}`} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {world.objectParts.map((part, index) => {
                const filled = index < completedCount;
                return (
                  <div
                    key={part}
                    ref={(node) => {
                      partRefs.current[index] = node;
                    }}
                    className={`rounded-[1.25rem] border px-4 py-4 text-sm transition-all ${
                      filled
                        ? `${world.softClass} border-white/0 text-slate-900`
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                      Part 0{index + 1}
                    </div>
                    <div className="mt-2 font-bold">{part}</div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3">
            {world.demoSteps.map((step, index) => {
              const isCurrent = index === activeStroke && completedCount > 0;
              const isDone = index < completedCount;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-4 rounded-[1.5rem] border px-4 py-4 transition-all ${
                    isCurrent
                      ? 'border-amber-300 bg-amber-50 shadow-md'
                      : isDone
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      isDone ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">筆劃任務</div>
                    <div className="mt-1 text-base font-bold text-slate-800">{step}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    {isDone ? '完成' : isCurrent ? '進行中' : '等待'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-indigo-100 p-3 text-indigo-700">
                  <Wand2 size={18} />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">每畫一筆，就完成多一點</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    新版首頁用動畫直接講清楚規則：筆順不只是答對與否，而是在職業世界裡一步一步把東西做出來。
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={materialRef}
              className={`relative overflow-hidden rounded-[1.75rem] border px-5 py-5 shadow-lg ${
                showReward ? `${world.softClass} border-white/0` : 'border-dashed border-slate-300 bg-slate-50 text-slate-400'
              }`}
            >
              <div ref={rewardGlowRef} className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-white/60 opacity-0 blur-xl" />
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/80 p-3 text-amber-600">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em]">關卡掉落</div>
                  <div className="mt-1 font-bold">
                    {showReward ? world.rewardLabel : '完成關卡後出現'}
                  </div>
                  <div className="mt-1 text-xs opacity-80">
                    {showReward ? '先閃光，再彈出，最後落定到材料欄。' : '等待角色完成最後一拍。'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

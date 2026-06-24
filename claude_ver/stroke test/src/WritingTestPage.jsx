import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, CheckCircle2, PenTool, PlayCircle, RotateCcw, Waves } from 'lucide-react';
import { getWorldById } from './data/exhibitionWorlds';

const WRITING_STROKES = [
  {
    id: 1,
    label: '點墨開筆',
    path: 'M160 92 Q150 115 162 142',
    hint: '先點墨，再落下第一個起筆。',
    dash: 82,
  },
  {
    id: 2,
    label: '橫筆定勢',
    path: 'M110 170 Q180 156 258 172',
    hint: '橫筆拉開結構，角色同步擺動毛筆。',
    dash: 170,
  },
  {
    id: 3,
    label: '落下中柱',
    path: 'M182 170 Q180 216 182 286',
    hint: '直筆向下，進度條與角色手勢一起推進。',
    dash: 132,
  },
  {
    id: 4,
    label: '冠牌落定',
    path: 'M120 312 Q182 294 248 312',
    hint: '最後一筆完成後，冠牌閃光、彈出、落定。',
    dash: 148,
  },
];

export default function WritingTestPage({ navigate, onPulseSfx }) {
  const scholarWorld = useMemo(() => getWorldById('speech'), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const actorRef = useRef(null);
  const brushRef = useRef(null);
  const inkDropRef = useRef(null);
  const progressFillRef = useRef(null);
  const stageRef = useRef(null);
  const rewardRef = useRef(null);
  const strokeRefs = useRef([]);
  const timersRef = useRef([]);
  const motionTimelineRef = useRef(null);

  useEffect(() => {
    motionTimelineRef.current = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });
    motionTimelineRef.current
      .to(actorRef.current, { y: -8, duration: 0.7 })
      .to(brushRef.current, { rotation: -18, x: -8, y: 12, duration: 0.32 }, 0)
      .to(inkDropRef.current, { scale: 1.15, autoAlpha: 0.95, duration: 0.28 }, 0.08)
      .to(actorRef.current, { y: 0, duration: 0.7 })
      .to(brushRef.current, { rotation: 14, x: 10, y: -6, duration: 0.42 }, 0.7)
      .to(inkDropRef.current, { scale: 0.82, autoAlpha: 0.5, duration: 0.3 }, 0.74);

    return () => {
      motionTimelineRef.current?.kill();
    };
  }, []);

  useEffect(() => {
    const progressPercent = ((activeIndex + (isComplete ? 1 : 0)) / WRITING_STROKES.length) * 100;
    if (progressFillRef.current) {
      gsap.to(progressFillRef.current, {
        width: `${Math.min(progressPercent, 100)}%`,
        duration: 0.45,
        ease: 'power2.out',
      });
    }
  }, [activeIndex, isComplete]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timersRef.current = [];
    };

    clearTimers();

    strokeRefs.current.forEach((node, index) => {
      if (!node) return;
      gsap.set(node, { strokeDasharray: WRITING_STROKES[index].dash, strokeDashoffset: WRITING_STROKES[index].dash });
    });
    gsap.set(rewardRef.current, { autoAlpha: 0, scale: 0.72, y: 26 });
    setIsComplete(false);

    if (!isPlaying) return clearTimers;

    WRITING_STROKES.forEach((stroke, index) => {
      const timerId = window.setTimeout(() => {
        setActiveIndex(index);
        onPulseSfx?.('step');
        const node = strokeRefs.current[index];
        if (node) {
          gsap.to(node, {
            strokeDashoffset: 0,
            duration: 0.7,
            ease: 'power1.inOut',
          });
        }

        gsap.fromTo(
          stageRef.current,
          { boxShadow: '0 0 0 rgba(99,102,241,0)' },
          { boxShadow: '0 0 0 18px rgba(99,102,241,0)', duration: 0.8, ease: 'power2.out' }
        );
      }, 500 + index * 1300);

      timersRef.current.push(timerId);
    });

    const completeTimer = window.setTimeout(() => {
      setIsComplete(true);
      onPulseSfx?.('reward');
      gsap.fromTo(
        rewardRef.current,
        { autoAlpha: 0, scale: 0.72, y: 26 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.8)' }
      );
    }, 500 + WRITING_STROKES.length * 1300);

    const restartTimer = window.setTimeout(() => {
      setActiveIndex(0);
    }, 500 + WRITING_STROKES.length * 1300 + 1800);

    timersRef.current.push(completeTimer, restartTimer);

    return clearTimers;
  }, [isPlaying, onPulseSfx]);

  const currentStroke = WRITING_STROKES[Math.min(activeIndex, WRITING_STROKES.length - 1)];

  return (
    <div className="home-v2-root min-h-screen bg-amber-50 text-slate-800">
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
        <section className="rounded-[2.5rem] border border-white/80 bg-white/80 px-6 py-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
                <PenTool size={16} />
                書寫測試頁
              </div>
              <h1 className="mt-4 text-4xl font-black text-slate-900 font-kai md:text-5xl">用戶正在寫字時，畫面應該怎樣回應</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                這一頁專門展示「書寫過程」：角色持續揮毫、當前筆劃同步亮起、進度條逐段推進，最後用完整的閃光與落定動作交代完成瞬間。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  onPulseSfx?.('step');
                  navigate('/');
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm"
              >
                返回首頁
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  onPulseSfx?.('reward');
                  navigate('/debug');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg"
              >
                打開實測工具
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-200">Writing Demo</div>
                  <div className="mt-2 text-3xl font-bold font-kai">{scholarWorld.title}</div>
                </div>
                <img src={scholarWorld.image} alt={scholarWorld.title} className="h-20 w-20 object-contain drop-shadow-2xl" />
              </div>

              <div
                ref={stageRef}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.22),_transparent_36%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-6"
              >
                <div className="absolute inset-0 opacity-60" style={{ background: scholarWorld.sceneAccent }} />

                <div className="relative z-10 grid min-h-[22rem] gap-5 md:grid-cols-[0.86fr_1.14fr]">
                  <div className="flex flex-col justify-between">
                    <div className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur">
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">角色持續演出</div>
                      <div className="mt-2 text-lg font-bold">{scholarWorld.actionLoopLabel}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-300">{scholarWorld.writingCue}</div>
                    </div>

                    <div className="relative flex flex-1 items-end justify-center pt-8">
                      <img
                        ref={actorRef}
                        src={scholarWorld.image}
                        alt={scholarWorld.title}
                        className="h-48 w-48 object-contain drop-shadow-2xl"
                      />
                      <div
                        ref={brushRef}
                        className="absolute bottom-20 left-1/2 ml-7 h-24 w-3 rounded-full bg-gradient-to-b from-amber-200 to-amber-900 shadow-[0_0_14px_rgba(251,191,36,0.45)]"
                      />
                      <div
                        ref={inkDropRef}
                        className="absolute bottom-14 left-1/2 ml-12 h-5 w-5 rounded-full bg-indigo-300 opacity-70 blur-[1px]"
                      />
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] bg-white/95 p-4 text-slate-800 shadow-xl">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">目前練習字</span>
                      <span className={`rounded-full px-3 py-1 font-bold ${scholarWorld.chipClass}`}>言</span>
                    </div>
                    <svg viewBox="0 0 360 360" className="w-full rounded-[1.5rem] bg-[#fdfbf7] p-4 shadow-inner">
                      <line x1="40" y1="40" x2="320" y2="320" stroke="#fca5a5" strokeDasharray="6 8" />
                      <line x1="320" y1="40" x2="40" y2="320" stroke="#fca5a5" strokeDasharray="6 8" />
                      <line x1="180" y1="32" x2="180" y2="328" stroke="#fca5a5" />
                      <line x1="32" y1="180" x2="328" y2="180" stroke="#fca5a5" />
                      <rect x="32" y="32" width="296" height="296" fill="none" stroke="#f87171" />

                      {WRITING_STROKES.map((stroke, index) => (
                        <path
                          key={stroke.id}
                          ref={(node) => {
                            strokeRefs.current[index] = node;
                          }}
                          d={stroke.path}
                          stroke={index <= activeIndex ? '#1f2937' : '#cbd5e1'}
                          strokeWidth="12"
                          strokeLinecap="round"
                          fill="none"
                        />
                      ))}
                    </svg>

                    <div className="mt-4 rounded-[1.25rem] bg-slate-100 px-4 py-3">
                      <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                        <span>書寫進度</span>
                        <span>{isComplete ? '100%' : `${Math.round((activeIndex / WRITING_STROKES.length) * 100)}%`}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-white">
                        <div ref={progressFillRef} className="h-full w-0 rounded-full bg-gradient-to-r from-indigo-300 via-sky-400 to-indigo-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  ref={rewardRef}
                  className="absolute bottom-6 right-6 rounded-[1.5rem] border border-white/0 bg-white px-5 py-4 text-slate-800 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-100 p-3 text-amber-700">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">完成動畫</div>
                      <div className="mt-1 text-base font-bold">{scholarWorld.completionLabel}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                  <PlayCircle size={14} />
                  當前筆劃
                </div>
                <div className="text-2xl font-bold text-slate-800 font-kai">{currentStroke.label}</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">{currentStroke.hint}</div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                  <Waves size={14} />
                  頁面控制
                </div>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isPlaying;
                      onPulseSfx?.('step');
                      setIsPlaying(next);
                    }}
                    className={`rounded-[1.25rem] px-4 py-4 text-left text-sm font-bold transition ${
                      isPlaying ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {isPlaying ? '暫停模擬書寫' : '恢復模擬書寫'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPulseSfx?.('reward');
                      setActiveIndex(0);
                      setIsComplete(false);
                      setIsPlaying(false);
                      window.setTimeout(() => setIsPlaying(true), 40);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5"
                  >
                    <RotateCcw size={16} />
                    重新播放
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">測試頁重點</div>
                <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
                  <div>角色不會停住等待，而是持續執行揮毫動作，讓觀眾感覺「真的正在寫」。</div>
                  <div>每筆完成都推進進度條與墨跡，完成時再播放閃光、彈出、落定的回饋。</div>
                  <div>若要接入真實感測資料，可直接前往實測工具頁，沿用既有 BLE/Serial 偵測流程。</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

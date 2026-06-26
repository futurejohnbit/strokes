import React, { useCallback } from 'react';
import { ArrowRight, Bluetooth, Music4, ScrollText } from 'lucide-react';
import { FREE_MUSIC_TRACK } from './utils/themeAudio';

const LANDING_STEPS = [
  {
    id: 'listen',
    title: '先聽主線',
    description: '你會知道想成為狀元，先要進入四個世界接受試煉，完成各自的職業任務。',
  },
  {
    id: 'write',
    title: '再跟著揮筆',
    description: '拿起 Micro:bit 神筆，照著畫面提示做出正確方向，角色就會跟著完成當前試煉任務。',
  },
  {
    id: 'collect',
    title: '最後收下配件',
    description: '每次過關都會掉落新的狀元帽配件，全部集齊後，就能完成你的狀元帽。',
  },
];

export default function ExhibitionHome({ navigate, onPulseSfx, musicEnabled, onToggleMusic }) {
  const handleNavigate = (to, tone = 'step') => {
    onPulseSfx?.(tone);
    navigate(to);
  };

  const scrollToId = useCallback((id) => {
    const target = document.getElementById(id);
    if (!target) return;
    onPulseSfx?.('step');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [onPulseSfx]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#fffaf5_48%,#fff1db_100%)] text-slate-800">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="rounded-[2.25rem] border border-amber-100 bg-white/90 px-6 py-8 shadow-[0_20px_60px_rgba(148,64,14,0.12)] backdrop-blur md:px-8 md:py-10">
          <div className="flex flex-col gap-6">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                行行出狀元
              </div>
              <h1 className="text-4xl font-black leading-tight text-slate-900 md:text-6xl font-kai">
                神筆出發，
                <br />
                先試煉，再成為狀元
              </h1>
              <p className="mx-auto max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                小朋友會拿著神筆走進展場，先聽懂一個很簡單的故事：
                想成為狀元，先要到木工坊、田園、廚房和書院接受試煉；只要照著提示把筆劃寫對，就能體驗不同職業、完成任務，並把掉落的配件組裝成狀元帽。
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleNavigate('/game', 'reward')}
                  className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-xl transition hover:-translate-y-1"
                >
                  <Bluetooth size={18} />
                  開始體驗遊戲
                </button>
                <button
                  type="button"
                  onClick={() => scrollToId('story-flow')}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 shadow-sm transition hover:-translate-y-1"
                >
                  <ScrollText size={18} />
                  看遊戲流程
                </button>
              </div>

              <button
                type="button"
                onClick={onToggleMusic}
                className={`inline-flex items-center gap-3 rounded-full border px-5 py-4 text-left text-sm font-bold shadow-sm transition hover:-translate-y-0.5 ${
                  musicEnabled
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <span className={`rounded-full p-2 ${musicEnabled ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <Music4 size={18} />
                </span>
                <span>
                  <span className="block">{musicEnabled ? '背景音樂開啟中' : '背景音樂已關閉'}</span>
                  <span className="block text-xs font-medium opacity-80">頁內切換，不使用浮動音響按鈕</span>
                </span>
              </button>
            </div>

            <article className="rounded-[1.75rem] border border-amber-100 bg-amber-50/70 px-5 py-5">
              <div className="text-sm font-bold text-amber-900">音樂來源</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                本頁背景音樂採用 {FREE_MUSIC_TRACK.provider} 的免費授權曲目
                <span className="font-bold text-slate-900"> {FREE_MUSIC_TRACK.title} </span>
                ，由 {FREE_MUSIC_TRACK.artist} 製作，已重新命名為
                <span className="font-bold text-slate-900"> exhibition-theme.mp3 </span>
                並放進
                <span className="font-bold text-slate-900"> public/audio/ </span>
                資料夾；回到首頁後，按右上的背景音樂按鈕就能開關播放。
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                這首音樂長度約 {FREE_MUSIC_TRACK.duration}，節奏輕快、帶木琴與遊戲感，適合小學生展場首頁循環播放。
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                <a
                  href={FREE_MUSIC_TRACK.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-bold text-amber-800 underline decoration-amber-300 underline-offset-4"
                >
                  查看曲目來源
                </a>
                <a
                  href={FREE_MUSIC_TRACK.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-bold text-amber-800 underline decoration-amber-300 underline-offset-4"
                >
                  查看授權說明
                </a>
              </div>
            </article>
          </div>
        </section>

        <section
          id="story-flow"
          className="mb-6 rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-8 shadow-lg backdrop-blur md:px-8"
        >
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-white">
                <ScrollText size={14} />
                遊戲流程概說
              </div>
              <h2 className="text-3xl font-bold text-slate-900 font-kai">三步就能看懂怎麼玩</h2>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('/game', 'reward')}
              className="inline-flex items-center gap-2 self-start rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800"
            >
              直接開始
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {LANDING_STEPS.map((step, index) => (
              <article key={step.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 px-5 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                  {index + 1}
                </div>
                <div className="mt-4 text-xl font-bold text-slate-800">{step.title}</div>
                <p className="mt-2 text-sm leading-7 text-slate-500">{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

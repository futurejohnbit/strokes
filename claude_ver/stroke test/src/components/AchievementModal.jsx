import React from 'react';
import { Award, Clock, Home, Play, Sparkles } from 'lucide-react';
import { formatTimeMMSS, formatTimeHHMMSS } from '../utils/timerUtils';

/**
 * 成就結算畫面 (AchievementModal)
 * 
 * @param {boolean} visible - 是否顯示
 * @param {number} levelTime - 本關耗時 (秒)
 * @param {number} totalTime - 總累積時間 (秒)
 * @param {function} onNext - 點擊「下一關」的回調
 * @param {function} onMenu - 點擊「主選單」的回調
 * @param {object} profession - 當前完成的職業資訊 (包含 title, icon 等)
 * @param {object} ceremony - 儀式化收成資訊
 */
function getToneClasses(color) {
  switch (color) {
    case 'green':
      return {
        shell: 'border-green-200',
        header: 'bg-green-50 border-green-100',
        icon: 'bg-green-100 text-green-600',
        pill: 'bg-green-100 text-green-700',
        reward: 'bg-green-50 border-green-200',
        button: 'bg-green-500 hover:bg-green-600 border-green-700 shadow-green-200',
      };
    case 'red':
      return {
        shell: 'border-rose-200',
        header: 'bg-rose-50 border-rose-100',
        icon: 'bg-rose-100 text-rose-600',
        pill: 'bg-rose-100 text-rose-700',
        reward: 'bg-rose-50 border-rose-200',
        button: 'bg-rose-500 hover:bg-rose-600 border-rose-700 shadow-rose-200',
      };
    case 'indigo':
      return {
        shell: 'border-indigo-200',
        header: 'bg-indigo-50 border-indigo-100',
        icon: 'bg-indigo-100 text-indigo-600',
        pill: 'bg-indigo-100 text-indigo-700',
        reward: 'bg-indigo-50 border-indigo-200',
        button: 'bg-indigo-500 hover:bg-indigo-600 border-indigo-700 shadow-indigo-200',
      };
    case 'amber':
    default:
      return {
        shell: 'border-amber-200',
        header: 'bg-amber-50 border-amber-100',
        icon: 'bg-amber-100 text-amber-600',
        pill: 'bg-amber-100 text-amber-700',
        reward: 'bg-amber-50 border-amber-200',
        button: 'bg-amber-500 hover:bg-amber-600 border-amber-700 shadow-amber-200',
      };
  }
}

const AchievementModal = ({
  visible,
  levelTime,
  totalTime,
  onNext,
  onMenu,
  profession,
  ceremony,
  nextLabel = '繼續下一關',
  selectedAction = 'next',
}) => {
  if (!visible) return null;

  const tone = getToneClasses(profession?.color);
  const title = ceremony?.title || `${profession?.title || '關卡'}挑戰成功！`;
  const subtitle = ceremony?.subtitle || '恭喜你完成了本次試煉';
  const rewardLabel = ceremony?.rewardLabel || '狀元帽配件';
  const rewardAccent = ceremony?.rewardAccent || '本次收成';
  const rewardSummary = ceremony?.rewardSummary || '新的狀元帽配件已順利收入收藏，徽章也會一併保留。';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 sm:p-5">
      <div className={`bg-white rounded-[2.25rem] shadow-2xl w-full max-w-4xl mx-auto overflow-hidden border-4 transform transition-all scale-100 ${tone.shell}`}>
        {/* Header: Title & Icon */}
        <div className={`px-5 py-5 md:px-7 md:py-5 text-center border-b-2 ${tone.header}`}>
          <div className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            {rewardAccent}
          </div>
          <h2 className="mt-2 text-[1.8rem] md:text-[2rem] font-bold text-slate-800 font-kai leading-tight">
            {title}
          </h2>
          <p className="text-slate-500 mt-2 text-sm md:text-base font-medium leading-6">{subtitle}</p>
        </div>

        {/* Content: Stats */}
        <div className="px-5 py-5 md:px-7 md:py-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[13rem_minmax(0,1fr)] md:items-center">
            <div className="flex justify-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-44 md:h-44 bg-white rounded-full border-4 border-slate-200 flex items-center justify-center relative shadow-lg group hover:border-amber-400 transition-colors">
              {profession?.badgeImage ? (
                 <img 
                   src={profession.badgeImage} 
                   alt={profession.title} 
                   className="max-w-[78%] max-h-[78%] object-contain hover:scale-105 transition-transform duration-500" 
                 />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                    <Award size={48} />
                    <span className="text-xs font-bold mt-1">徽章</span>
                </div>
              )}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`rounded-[1.75rem] border px-5 py-4 md:px-6 md:py-5 ${tone.reward}`}>
                <div className="flex gap-4 items-start">
                  <div className={`rounded-full p-3 shadow-sm shrink-0 ${tone.icon}`}>
                    <Sparkles size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">本次收成</div>
                    <div className="mt-1 text-[1.55rem] md:text-[1.7rem] leading-tight font-bold text-slate-800">{rewardLabel}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">{rewardSummary}</div>
                  </div>
                </div>
              </div>

              {/* Time Stats Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                  <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Clock size={12} /> 本關耗時
                  </div>
                  <div className="text-2xl font-mono font-bold text-blue-700">
                    {formatTimeMMSS(levelTime)}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center">
                  <div className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <Clock size={12} /> 總累積時間
                  </div>
                  <div className="text-2xl font-mono font-bold text-purple-700">
                    {formatTimeHHMMSS(totalTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Actions */}
        <div className="px-5 py-4 md:px-7 md:py-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button 
            onClick={onMenu}
            className={`flex-1 py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-2xl border-2 border-slate-200 transition-colors flex items-center justify-center gap-2 ${
              selectedAction === 'menu' ? 'ring-4 ring-offset-4 ring-slate-300 shadow-lg' : ''
            }`}
          >
            <Home size={20} /> 主選單
          </button>
          
          <button 
            onClick={onNext}
            className={`flex-1 py-3.5 px-4 text-white font-bold rounded-2xl shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 border-b-4 ${tone.button} ${
              selectedAction === 'next' ? 'ring-4 ring-offset-4 ring-amber-300 scale-[1.02]' : ''
            }`}
          >
            <Play size={20} fill="currentColor" /> {nextLabel}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AchievementModal;

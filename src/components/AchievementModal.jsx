
import React from 'react';
import { Award, Clock, RotateCcw, Play, Home } from 'lucide-react';
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
 */
const AchievementModal = ({ visible, levelTime, totalTime, onNext, onMenu, profession }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-4 overflow-hidden border-4 border-amber-200 transform transition-all scale-100">
        
        {/* Header: Title & Icon */}
        <div className="bg-amber-50 p-6 text-center border-b-2 border-amber-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full text-amber-600 mb-4 shadow-inner animate-bounce">
            {profession?.icon || <Award size={48} />}
          </div>
          <h2 className="text-3xl font-bold text-slate-800 font-kai">
            {profession?.title || '關卡'}挑戰成功！
          </h2>
          <p className="text-slate-500 mt-2 font-medium">恭喜你完成了本次試煉</p>
        </div>

        {/* Content: Stats */}
        <div className="p-8 space-y-6">
          
          {/* Badge Display */}
          <div className="flex justify-center mb-6">
            <div className="w-40 h-40 bg-white rounded-full border-4 border-slate-200 flex items-center justify-center relative overflow-hidden shadow-lg group hover:border-amber-400 transition-colors">
              {profession?.badgeImage ? (
                 <img 
                   src={profession.badgeImage} 
                   alt={profession.title} 
                   className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-500" 
                 />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                    <Award size={48} />
                    <span className="text-xs font-bold mt-1">徽章</span>
                </div>
              )}
            </div>
          </div>

          {/* Time Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Level Time */}
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
              <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Clock size={12} /> 本關耗時
              </div>
              <div className="text-2xl font-mono font-bold text-blue-700">
                {formatTimeMMSS(levelTime)}
              </div>
            </div>

            {/* Total Time */}
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

        {/* Footer: Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onMenu}
            className="flex-1 py-3 px-4 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-xl border-2 border-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} /> 主選單
          </button>
          
          <button 
            onClick={onNext}
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-transform hover:scale-105 flex items-center justify-center gap-2 border-b-4 border-amber-700"
          >
            <Play size={20} fill="currentColor" /> 繼續下一關
          </button>
        </div>

      </div>
    </div>
  );
};

export default AchievementModal;

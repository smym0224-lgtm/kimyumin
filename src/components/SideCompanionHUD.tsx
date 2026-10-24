import React from 'react';
import {
  Clock,
  AlertTriangle,
  Lock,
  X,
  Check
} from 'lucide-react';
import { ClassTimerState, Step, StudentClueResponse, Activity2Response, Activity3Response } from '../types';

interface SideCompanionHUDProps {
  classTimer: ClassTimerState;
  remainingSeconds: number;
  warningMsg: string | null;
  onClearWarning: () => void;
  studentName: string;
  studentGroup?: number;
  stage2Unlocked?: boolean;
  step: Step;
  currentClueIdx: number;
  clueResponses: Record<number, StudentClueResponse>;
  activity2: Activity2Response;
  activity3: Activity3Response;
  onSelectClue?: (idx: number) => void;
  isTeacherAuthenticated: boolean;
  onOpenTeacherAuth?: () => void;
}

export const SideCompanionHUD: React.FC<SideCompanionHUDProps> = ({
  classTimer,
  remainingSeconds,
  warningMsg,
  onClearWarning,
  studentName,
  studentGroup,
  stage2Unlocked = false,
  step,
  currentClueIdx,
  clueResponses,
  activity2,
  activity3,
  onSelectClue,
  isTeacherAuthenticated,
  onOpenTeacherAuth
}) => {
  // Format total seconds to mm:ss
  const formatTime = (totalSec: number) => {
    if (totalSec <= 0) return '00:00';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalDurationSec = (classTimer.durationMinutes || 25) * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalDurationSec - remainingSeconds) / totalDurationSec) * 100)
  );

  const isLowTime = classTimer.isRunning && remainingSeconds <= 180; // 3분 이하

  // Count filled clues (1번 질문: 신뢰도 선택, 2번 질문: 까닭 작성)
  const filledCluesCount = Array.from({ length: 8 }).filter((_, i) => {
    const res = clueResponses[i + 1];
    return res && res.trustLevel && res.reason?.trim();
  }).length;

  return (
    <aside className="w-full xl:w-80 space-y-4 no-print select-none">
      {/* 1. 필수 입력 누락 경고 카드 (화면 바로 옆에 즉시 강조) */}
      {warningMsg && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-3xl p-5 shadow-xl shadow-rose-500/10 animate-bounce duration-300 relative">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <span className="font-black text-rose-950 text-sm tracking-tight">
                필수 항목 확인 필요!
              </span>
            </div>
            <button
              onClick={onClearWarning}
              className="text-rose-400 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100 transition cursor-pointer"
              title="경고 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs sm:text-sm font-bold text-rose-900 leading-relaxed pl-1">
            {warningMsg}
          </p>
          <div className="mt-3 pt-2 border-t border-rose-200/80 flex items-center justify-between text-[11px] text-rose-700 font-semibold">
            <span>* 필수 항목을 작성해야 다음 단계로 이동합니다</span>
            <button
              onClick={onClearWarning}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 2. 화면 옆 활동 타이머 카드 (아이들 시선 바로 옆에 위치) */}
      <div
        className={`bg-white rounded-3xl border-2 p-5 shadow-lg transition-all ${
          classTimer.isExpired
            ? 'border-rose-400 bg-rose-50/30'
            : isLowTime
            ? 'border-amber-400 bg-amber-50/40 ring-4 ring-amber-300/40'
            : 'border-indigo-200'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs ${
                classTimer.isExpired
                  ? 'bg-rose-500'
                  : classTimer.isRunning
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-indigo-600'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-black text-xs text-slate-800 tracking-tight">
              수업 활동 남은 시간
            </span>
          </div>

          <span
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
              classTimer.isRunning
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : classTimer.isExpired
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {classTimer.isRunning
              ? '⏳ 진행 중'
              : classTimer.isExpired
              ? '⏰ 종료됨'
              : '⏸️ 시작 대기'}
          </span>
        </div>

        {/* 대형 디지털 시간 디스플레이 */}
        <div className="text-center py-2">
          <div
            className={`font-mono text-4xl sm:text-5xl font-black tracking-tight ${
              classTimer.isExpired
                ? 'text-rose-600'
                : isLowTime
                ? 'text-rose-600 animate-pulse'
                : 'text-slate-900'
            }`}
          >
            {classTimer.isExpired ? '00:00' : formatTime(remainingSeconds)}
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-1">
            {classTimer.isRunning
              ? isLowTime
                ? '⚠️ 마감 3분 전입니다! 서둘러 정리해 보세요.'
                : `총 ${classTimer.durationMinutes || 25}분 수업 활동 진행 중`
              : classTimer.isExpired
              ? '활동 시간이 종료되어 자동 제출되었습니다.'
              : '선생님이 시작 버튼을 누르면 시간이 흐릅니다.'}
          </p>
        </div>

        {/* 진행 게이지 바 */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>시작</span>
            <span className="font-bold text-slate-600">
              {Math.round(progressPercent)}% 진행
            </span>
            <span>종료</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                classTimer.isExpired
                  ? 'bg-rose-500'
                  : isLowTime
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 타이머 안내 문구 */}
        <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-3 leading-snug">
          💡 시간이 모두 끝나면 지금까지 작성한 수첩이 교사용 화면으로 자동 제출됩니다.
        </p>

        {onOpenTeacherAuth && !isTeacherAuthenticated && (
          <div className="mt-3 pt-2 border-t border-slate-100 text-center">
            <button
              onClick={onOpenTeacherAuth}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>선생님 타이머 설정/초기화 (교사 전용)</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. 나의 탐정 활동 진행 현황 카드 */}
      <div className="bg-white rounded-3xl border-2 border-amber-200 p-5 shadow-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              🕵️
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                나의 탐정 수첩 현황
              </span>
              <span className="font-black text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>{studentName ? `${studentName} 탐정` : '이름 미입력'}</span>
                {studentGroup && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-black bg-indigo-100 text-indigo-900 border border-indigo-200">
                    {studentGroup}조
                  </span>
                )}
              </span>
            </div>
          </div>
          <span className="text-xs font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
            단서 {filledCluesCount}/8
          </span>
        </div>

        {/* 단서 8개 조사 진행도 (구간별 잠금 반영) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <span>단서 조사</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black border ${
                stage2Unlocked
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {stage2Unlocked ? '2단계(5~8) 진행 중' : '1단계(1~4) 진행 중'}
              </span>
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold">
              {filledCluesCount === 8 ? '모두 완료! 🎉' : `${filledCluesCount}/8개 완료`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const clueId = i + 1;
              const isLocked = i >= 4 && !stage2Unlocked;
              const res = clueResponses[clueId];
              const isDone = Boolean(res?.trustLevel && res?.reason?.trim());
              const isCurrent = step === 'clues' && currentClueIdx === i;

              return (
                <button
                  key={clueId}
                  onClick={() => onSelectClue && onSelectClue(i)}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition border ${
                    isCurrent
                      ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300 shadow-sm'
                      : isLocked
                      ? 'bg-slate-100/80 text-slate-400 border-dashed border-slate-300 hover:bg-slate-200 cursor-not-allowed'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 cursor-pointer'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 cursor-pointer'
                  }`}
                  title={
                    isLocked
                      ? `단서 ${clueId}: 2단계 잠김 (선생님이 5~8번을 시작해 주실 때까지 대기)`
                      : `단서 ${clueId}로 바로 이동`
                  }
                >
                  <span className="text-[10px] opacity-80">단서 {clueId}</span>
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  ) : isDone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                  ) : (
                    <span className="text-[10px] text-slate-400 mt-0.5">-</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2단계 & 3단계 상태 */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span>2단계. 소문 신뢰성 종합 판단</span>
            </span>
            {activity2.rumorTrustLevel && activity2.reason?.trim() ? (
              <span className="text-emerald-700 font-black flex items-center gap-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> 작성완료
              </span>
            ) : (
              <span className="text-slate-400 font-medium">대기 중</span>
            )}
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span>3단계. 올바른 탐정 태도 성찰</span>
            </span>
            {activity3.q1SpreadProblem?.trim() && activity3.q2Attitude?.trim() ? (
              <span className="text-emerald-700 font-black flex items-center gap-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> 작성완료
              </span>
            ) : (
              <span className="text-slate-400 font-medium">대기 중</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

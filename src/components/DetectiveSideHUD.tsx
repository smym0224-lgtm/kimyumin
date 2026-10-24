import React from 'react';
import { ClassTimerState, Step } from '../types';
import {
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface DetectiveSideHUDProps {
  remainingSeconds: number;
  classTimer: ClassTimerState;
  warningMsg: string | null;
  onClearWarning: () => void;
  currentStep: Step;
  currentClueIdx: number;
  studentName: string;
  formatTime: (totalSec: number) => string;
  onTeacherAuthReset?: () => void;
}

export const DetectiveSideHUD: React.FC<DetectiveSideHUDProps> = ({
  remainingSeconds,
  classTimer,
  warningMsg,
  onClearWarning,
  currentStep,
  currentClueIdx,
  studentName,
  formatTime,
  onTeacherAuthReset
}) => {
  const totalDurationSec = (classTimer.durationMinutes || 25) * 60;
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((totalDurationSec - remainingSeconds) / totalDurationSec) * 100))
  );

  const isUrgent = remainingSeconds <= 180 && classTimer.isRunning;

  return (
    <aside className="no-print w-full lg:w-76 shrink-0 lg:sticky lg:top-20 space-y-3.5">
      {/* 1. 실시간 남은 시간 카드 (화면 옆에서 바로 확인) */}
      <div
        className={`rounded-3xl border-2 p-5 shadow-md transition-all ${
          classTimer.isExpired
            ? 'bg-red-50 border-red-300 text-red-950'
            : isUrgent
            ? 'bg-rose-50 border-rose-400 text-rose-950 animate-pulse ring-2 ring-rose-300'
            : classTimer.isRunning
            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-black">
            <Clock className={`w-4 h-4 ${classTimer.isRunning ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />
            <span>⏱️ 남은 활동 시간</span>
          </div>

          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              classTimer.isExpired
                ? 'bg-red-200 text-red-900'
                : isUrgent
                ? 'bg-rose-200 text-rose-900 font-black'
                : classTimer.isRunning
                ? 'bg-amber-200 text-amber-900'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {classTimer.isExpired
              ? '⏰ 시간 종료'
              : isUrgent
              ? '🚨 마감 3분 전!'
              : classTimer.isRunning
              ? '⏳ 진행 중'
              : '⏸️ 대기 중'}
          </span>
        </div>

        {/* 대형 디지털 시계 */}
        <div className="flex items-baseline justify-between gap-2 my-1">
          <span className="font-mono font-black text-3xl sm:text-4xl tracking-tight text-slate-900">
            {classTimer.isExpired ? '00:00' : formatTime(remainingSeconds)}
          </span>

          {onTeacherAuthReset && (
            <button
              type="button"
              onClick={onTeacherAuthReset}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
              title="시간 재설정 (교사 전용)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기화</span>
            </button>
          )}
        </div>

        {/* 진행 바 */}
        <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden mt-2 mb-1.5 border border-slate-300/60">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isUrgent ? 'bg-rose-500' : classTimer.isRunning ? 'bg-amber-500' : 'bg-slate-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500 leading-tight">
          {classTimer.isExpired
            ? '활동 시간이 종료되어 학생 수첩이 자동 제출되었습니다.'
            : '활동 시간이 지나면 작성한 내용이 자동 제출됩니다.'}
        </p>
      </div>

      {/* 2. 경고문 알림 & 필수 입력 안내 (화면 옆에서 바로 확인) */}
      {warningMsg ? (
        <div className="rounded-3xl border-2 sm:border-3 border-rose-400 bg-rose-50/95 p-4 sm:p-5 shadow-lg text-rose-950 animate-in fade-in duration-200 ring-2 ring-rose-300">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
            <h4 className="font-black text-sm text-rose-900">
              🚨 필수 입력 확인 필요!
            </h4>
          </div>

          <p className="text-xs sm:text-sm font-extrabold text-rose-900 leading-relaxed bg-white/80 p-3 rounded-2xl border border-rose-200">
            {warningMsg}
          </p>

          <button
            type="button"
            onClick={onClearWarning}
            className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer flex items-center justify-center gap-1"
          >
            <span>확인하고 작성하기</span>
          </button>
        </div>
      ) : (
        /* 경고문이 없을 때는 친절한 단계별 탐정 가이드 표시 */
        <div className="rounded-3xl border-2 border-indigo-200/90 bg-indigo-50/70 p-4 shadow-xs text-indigo-950 space-y-2">
          <div className="flex items-center gap-1.5 font-black text-xs text-indigo-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>탐정 필수 체크포인트</span>
          </div>

          <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white/80 p-2.5 rounded-xl border border-indigo-100">
            {currentStep === 'intro' && (
              <p>
                <strong>탐정 이름</strong>을 입력하고, 선생님이 시작 버튼을 누르면 단서 조사가 시작됩니다!
              </p>
            )}
            {currentStep === 'clues' && (
              <p>
                현재 <strong>단서 {currentClueIdx + 1}/8번</strong> 조사 중! <strong>1번 문항(특징)</strong>과 <strong>2번 문항(신뢰도)</strong>은 필수 작성입니다.
              </p>
            )}
            {currentStep === 'activity2' && (
              <p>
                8개 단서를 토대로 <strong>소문 신뢰도</strong>와 <strong>판단 이유</strong>를 필수로 선택/작성해 주세요!
              </p>
            )}
            {currentStep === 'activity3' && (
              <p>
                최종 추리 <strong>질문 1, 2</strong>에 자신의 생각을 모두 정성껏 작성해 주세요!
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. 현재 탐정 및 진행 단계 현황 */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-xs text-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-500">참여 탐정</span>
          <span className="font-black text-slate-900 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span>{studentName || '이름 입력 전'}</span>
          </span>
        </div>

        <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px]">
          <span className="font-black text-slate-600 block mb-1">진행 순서:</span>
          <div className="space-y-1 text-slate-500 font-semibold">
            <div className={`flex items-center gap-1.5 ${currentStep === 'clues' ? 'text-indigo-600 font-black' : ''}`}>
              <span>{currentStep === 'clues' ? '👉' : '•'}</span>
              <span>1단계: 8개 단서 탐색 ({currentClueIdx + 1}/8)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${currentStep === 'activity2' ? 'text-indigo-600 font-black' : ''}`}>
              <span>{currentStep === 'activity2' ? '👉' : '•'}</span>
              <span>2단계: 신뢰성 판단 (활동 2)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${currentStep === 'activity3' ? 'text-indigo-600 font-black' : ''}`}>
              <span>{currentStep === 'activity3' ? '👉' : '•'}</span>
              <span>3단계: 최종 추리 질문 (활동 3)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>•</span>
              <span>4단계: 1~5조 모둠 결과 공유</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

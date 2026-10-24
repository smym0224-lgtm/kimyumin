import React from 'react';
import { CLUES } from '../data/clues';
import { StudentClueResponse, Activity2Response, Activity3Response } from '../types';
import {
  BookOpen,
  Printer,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User,
  School,
  Sparkles
} from 'lucide-react';

interface NotebookViewProps {
  studentName: string;
  setStudentName: (name: string) => void;
  clueResponses: Record<number, StudentClueResponse>;
  activity2: Activity2Response;
  activity3: Activity3Response;
  onGoToStep: (step: 'clues' | 'activity2' | 'activity3') => void;
  onBackToCompletion?: () => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({
  studentName,
  setStudentName,
  clueResponses,
  activity2,
  activity3,
  onGoToStep,
  onBackToCompletion
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 font-sans">
      {/* 액션 바 (화면 출력 전용, 인쇄 시 숨김) */}
      <div className="no-print bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">나의 탐정 수첩 종합 리포트</h2>
            <p className="text-xs text-slate-600">모든 단서 기록과 신뢰성 판단, 최종 추리가 한 권으로 완성되었습니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onBackToCompletion && (
            <button
              onClick={onBackToCompletion}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              완료 화면으로
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>인쇄하기 (PDF 저장)</span>
          </button>
        </div>
      </div>

      {/* 탐정 수첩 본문 (인쇄 시 A4 보고서 형태) */}
      <div className="bg-white rounded-3xl border-2 sm:border-4 border-amber-200/90 p-6 sm:p-10 shadow-xl print:p-0 print:border-none print:shadow-none text-slate-900">
        {/* 수첩 헤더 */}
        <div className="border-b-4 border-amber-500 pb-5 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <School className="w-3.5 h-3.5 text-amber-700" />
              효성초등학교 5~6학년 허위정보 판별 수업
            </span>
            <span className="text-xs font-bold text-slate-500">
              활동명: 팩트 탐정단: 사라진 효성벼리 문화예술발표회
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 mt-2">
            <span>🕵️‍♂️ 팩트 탐정단 수첩 보고서</span>
          </h1>

          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-slate-700">탐정 이름:</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 김유민"
                className="no-print font-bold text-indigo-700 border-b-2 border-indigo-400 focus:outline-none px-2 py-0.5 bg-indigo-50/50 rounded"
              />
              <span className="print-only font-bold text-indigo-800 underline">
                {studentName || '김유민'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              작성일: {new Date().toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 1부: 단서 1~8 탐색 기록 */}
        <section className="mb-10 page-break-inside-avoid">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs flex items-center justify-center font-black">
                1
              </span>
              <span>단서 1~8 탐색 및 특징 기록</span>
            </h2>
            <button
              onClick={() => onGoToStep('clues')}
              className="no-print text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
            >
              <Edit3 className="w-3.5 h-3.5" />
              수정하기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLUES.map((clue) => {
              const res = clueResponses[clue.id];
              return (
                <div
                  key={clue.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">
                        {clue.title}
                      </span>
                      {res?.trustLevel && res?.reason ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 완료
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                          미작성
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-600 shrink-0">1. 신뢰도 평가:</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                          {res?.trustLevel || '선택 안 함'}
                        </span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-600 block mb-0.5">
                          2. 그렇게 생각한 까닭:
                        </span>
                        <p className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed min-h-[38px]">
                          {res?.reason || '(까닭 미작성)'}
                        </p>
                      </div>

                      {res?.features && (
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="font-semibold">• 이전 발견 특징: </span>
                          <span>{res.features}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2부: 활동 2 - 신뢰성 판단 */}
        <section className="mb-10 page-break-inside-avoid">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center font-black">
                2
              </span>
              <span>활동 2: 신뢰성 판단 결과</span>
            </h2>
            <button
              onClick={() => onGoToStep('activity2')}
              className="no-print text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
            >
              <Edit3 className="w-3.5 h-3.5" />
              수정하기
            </button>
          </div>

          <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-200/80 space-y-4 text-sm">
            <div>
              <p className="font-bold text-slate-900 mb-1">
                질문 1. 효성초등학교 효성벼리 문화예술발표회가 취소되었다는 소문을 얼마나 믿을 수 있나요?
              </p>
              <div className="inline-block mt-1 px-4 py-2 rounded-xl bg-white border-2 border-indigo-400 font-extrabold text-indigo-900 text-base shadow-sm">
                👉 {activity2.rumorTrustLevel || '응답 없음'}
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-1">
                질문 2. 그렇게 판단한 이유는 무엇인가요?
              </p>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium whitespace-pre-wrap min-h-[50px]">
                {activity2.reason || '(작성된 근거 없음)'}
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900 mb-1">
                질문 3. 판단에 가장 중요했던 단서는 무엇인가요?
              </p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {activity2.importantClueIds.length > 0 ? (
                  activity2.importantClueIds.map((id) => {
                    const clue = CLUES.find((c) => c.id === id);
                    return (
                      <span
                        key={id}
                        className="px-3 py-1 bg-white border border-indigo-300 text-indigo-900 font-bold rounded-lg text-xs shadow-xs"
                      >
                        ✓ {clue ? clue.title : `단서 ${id}`}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-slate-500 text-xs">(선택된 단서 없음)</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3부: 활동 3 - 최종 추리 질문 */}
        <section className="page-break-inside-avoid">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs flex items-center justify-center font-black">
                3
              </span>
              <span>활동 3: 최종 추리 및 올바른 태도</span>
            </h2>
            <button
              onClick={() => onGoToStep('activity3')}
              className="no-print text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
            >
              <Edit3 className="w-3.5 h-3.5" />
              수정하기
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200">
              <p className="font-bold text-slate-900 mb-2">
                질문 1. 효성벼리 문화예술발표회 취소 소문을 믿고 친구에게 전달하면 어떤 문제가 생길까?
              </p>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium whitespace-pre-wrap min-h-[60px]">
                {activity3.q1SpreadProblem || '(답변 없음)'}
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-200">
              <p className="font-bold text-slate-900 mb-2">
                질문 2. 놀랍거나 급한 정보를 보았을 때 어떤 태도를 가져야 할까?
              </p>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium whitespace-pre-wrap min-h-[60px]">
                {activity3.q2Attitude || '(답변 없음)'}
              </div>
            </div>
          </div>
        </section>

        {/* 수첩 서명란 */}
        <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-300 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-900 font-bold text-xs mb-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>단서를 살펴보고, 근거를 모아, 스스로 판단했어요.</span>
          </div>
          <p className="text-xs text-slate-500">
            효성초등학교 팩트 탐정단 공식 인증 수첩
          </p>
        </div>
      </div>
    </div>
  );
};

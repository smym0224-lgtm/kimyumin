import React from 'react';
import {
  FileText,
  Calendar,
  MessageSquare,
  AlertTriangle,
  FileClock,
  StickyNote,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface ClueRendererProps {
  clueId: number;
}

export const ClueRenderer: React.FC<ClueRendererProps> = ({ clueId }) => {
  return (
    <div className="relative w-full bg-white rounded-2xl border-2 border-amber-200 shadow-md p-5 sm:p-7 text-slate-800">
      {/* 수업용 가상 자료 배지 */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-100">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <HelpCircle className="w-3.5 h-3.5" />
          수업용 가상 자료 (실제 학교 공지가 아닙니다)
        </span>
        <span className="text-xs font-semibold text-slate-500">
          단서 자료 #{clueId}
        </span>
      </div>

      {/* 단서 1. 공식 가정통신문 */}
      {clueId === 1 && (
        <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-200/80 max-w-lg mx-auto font-sans">
          <div className="flex items-center justify-between border-b-2 border-slate-700 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <span className="text-xs font-bold text-slate-500 tracking-wider">제2026-104호</span>
            </div>
            <span className="text-sm font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
              공식 가정통신문
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-center text-slate-900 mb-6 tracking-tight">
            효성초등학교 효성벼리 문화예술발표회 안내
          </h3>

          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-3.5 text-slate-800 text-base leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-700 shrink-0">• 일시:</span>
              <span className="font-semibold text-slate-900">2026년 10월 30일(금) 오전 9시 50분</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-700 shrink-0">• 장소:</span>
              <span className="font-semibold text-slate-900">강당</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-700 shrink-0">• 내용:</span>
              <span>학생들의 다양한 재능과 예술적 끼를 나누는 효성벼리 문화예술발표회를 개최합니다.</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-center flex flex-col items-center justify-center">
            <p className="text-xs text-slate-500 font-medium mb-1">2026년 10월 12일</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-base font-bold text-slate-900">효 성 초 등 학 교 장</span>
              <span className="w-8 h-8 rounded-full border-2 border-red-500 text-red-600 flex items-center justify-center text-[10px] font-black -rotate-12">
                [직인]
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 단서 2. 공식 학사 일정표 */}
      {clueId === 2 && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 max-w-lg mx-auto font-sans">
          <div className="flex items-center gap-2 mb-4 text-emerald-800">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-base">효성초등학교 2026학년도 10월 주요 학사일정표</h4>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-300">
            <table className="w-full text-left border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-emerald-50 text-emerald-950 border-b border-slate-300">
                  <th className="py-3 px-4 font-bold w-1/2">날짜</th>
                  <th className="py-3 px-4 font-bold w-1/2">일정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">2026년 10월 30일(금)</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-md font-bold bg-indigo-100 text-indigo-800">
                      효성벼리 문화예술발표회
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">2026년 10월 31일(토)</td>
                  <td className="py-3.5 px-4 text-slate-700">휴업일</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 mt-4 text-right">
            출처: 효성초등학교 교육과정 운영 계획서
          </p>
        </div>
      )}

      {/* 단서 3. 단체 채팅방의 소문 */}
      {clueId === 3 && (
        <div className="bg-[#BACEE0] rounded-2xl p-4 sm:p-5 max-w-md mx-auto shadow-inner">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#a6b8c8] text-slate-700">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-sm">5학년 우리반 단체 채팅방 (18명)</span>
            </div>
            <span className="text-[11px] text-slate-600">오후 4:21</span>
          </div>

          <div className="space-y-3 text-sm">
            {/* 김소현 (학생 A) */}
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center font-bold text-[11px] text-amber-950 shrink-0">
                소현
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-0.5">김소현</span>
                <div className="bg-white rounded-r-2xl rounded-bl-2xl p-3 shadow-sm text-slate-900 max-w-[260px]">
                  얘들아, 효성벼리 문화예술발표회 취소됐대!
                </div>
              </div>
            </div>

            {/* 정다윤 (학생 B) */}
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center font-bold text-[11px] text-blue-950 shrink-0">
                다윤
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-0.5">정다윤</span>
                <div className="bg-white rounded-r-2xl rounded-bl-2xl p-3 shadow-sm text-slate-900 max-w-[260px]">
                  진짜? 왜?
                </div>
              </div>
            </div>

            {/* 김소현 (학생 A) */}
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center font-bold text-[11px] text-amber-950 shrink-0">
                소현
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-0.5">김소현</span>
                <div className="bg-white rounded-r-2xl rounded-bl-2xl p-3 shadow-sm text-slate-900 max-w-[260px]">
                  그건 잘 모르겠어. 누가 그랬어.
                </div>
              </div>
            </div>

            {/* 김재희 (학생 C) */}
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center font-bold text-[11px] text-emerald-950 shrink-0">
                재희
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-0.5">김재희</span>
                <div className="bg-white rounded-r-2xl rounded-bl-2xl p-3 shadow-sm text-slate-900 max-w-[260px]">
                  헐, 그럼 준비 안 해도 되는 거야?
                </div>
              </div>
            </div>

            {/* 김소현 (학생 A) */}
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center font-bold text-[11px] text-amber-950 shrink-0">
                소현
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-0.5">김소현</span>
                <div className="bg-white rounded-r-2xl rounded-bl-2xl p-3 shadow-sm text-slate-900 max-w-[260px]">
                  그런가 봐.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 단서 4. '긴급 취소' 안내문 캡처 */}
      {clueId === 4 && (
        <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-7 max-w-md mx-auto shadow-xl relative border-4 border-red-500">
          <div className="flex items-center gap-2 text-red-400 font-black text-sm mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            <span>SNS 공유 화면 캡처본</span>
          </div>

          <div className="bg-black/60 rounded-lg p-5 border border-red-500/50 space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-red-500 tracking-wide text-center">
              [긴급] 효성초등학교 효성벼리 문화예술발표회 취소!
            </h3>
            <p className="text-base sm:text-lg text-slate-200 text-center leading-relaxed font-semibold">
              “내일부터 예정된 행사는 취소되었습니다. 자세한 사항은 추후 안내하겠습니다.”
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
            <span>출처: 알 수 없음</span>
            <span>작성자: 미표시</span>
          </div>
        </div>
      )}

      {/* 단서 5. 2025년 작년 안내문 */}
      {clueId === 5 && (
        <div className="bg-stone-50 rounded-xl p-5 border-2 border-stone-300 max-w-lg mx-auto font-sans relative">
          {/* 작년 도장 워터마크 느낌 */}
          <div className="absolute right-4 top-4 border-2 border-amber-600/60 text-amber-700/80 rounded px-2 py-0.5 text-xs font-bold rotate-6">
            2025학년도 문서보관함
          </div>

          <div className="border-b border-stone-300 pb-2 mb-4">
            <span className="text-xs font-bold text-stone-500">제2025-089호 (작년 안내문)</span>
          </div>

          <h3 className="text-xl font-bold text-center text-stone-900 mb-5">
            효성초등학교 효성벼리 문화예술발표회 안내
          </h3>

          <div className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm space-y-3 text-stone-800 text-base">
            <div className="flex items-start gap-2">
              <span className="font-bold text-stone-600">• 일시:</span>
              <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">2025년 10월 30일</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-stone-600">• 장소:</span>
              <span>강당</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-stone-600">• 안내:</span>
              <span>행사 일정 및 운영 사항을 안내합니다.</span>
            </div>
          </div>

          <div className="mt-6 text-center text-sm font-semibold text-stone-600">
            효 성 초 등 학 교 장
          </div>
        </div>
      )}

      {/* 단서 6. 익명의 쪽지 */}
      {clueId === 6 && (
        <div className="max-w-md mx-auto my-3">
          {/* 노란색 메모지 디자인 */}
          <div className="bg-[#fff9c4] text-slate-900 p-6 rounded-lg shadow-lg border-t-8 border-[#fbc02d] relative rotate-[-1.5deg]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-amber-200/80 backdrop-blur-xs rounded-sm shadow-xs border border-amber-300/60 rotate-2"></div>
            
            <div className="flex items-center gap-2 mb-3 text-amber-900 font-semibold text-xs border-b border-amber-300/80 pb-2">
              <StickyNote className="w-4 h-4 text-amber-800" />
              <span>교실 바닥에서 주운 익명의 쪽지</span>
            </div>

            <p className="text-lg sm:text-xl font-bold leading-relaxed text-slate-800 py-3 text-center font-memo">
              “선생님이 효성벼리 문화예술발표회 취소됐다고 하셨대. 친구한테 들었어.”
            </p>

            <div className="mt-4 pt-2 border-t border-amber-300/60 text-right text-xs text-amber-800 font-medium">
              (작성자 이름 없음)
            </div>
          </div>
        </div>
      )}

      {/* 단서 7. 효성벼리 문화예술발표회 준비 사진 */}
      {clueId === 7 && (
        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-300 max-w-lg mx-auto">
          {/* 일러스트 가상 사진 카드: 학생들이 강당 무대와 의자를 준비하는 모습 */}
          <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 rounded-lg p-5 text-center text-white relative overflow-hidden min-h-[220px] flex flex-col justify-between">
            {/* 상단 현수막 일러스트 */}
            <div className="bg-amber-400 text-amber-950 px-4 py-2 rounded-md font-black text-sm tracking-widest shadow-md mx-auto max-w-xs border-2 border-amber-300">
              ★ 2026 효성벼리 문화예술발표회 ★
            </div>

            {/* 강당 무대와 의자, 준비하는 학생들 SVG 그래픽 */}
            <div className="my-4 py-2">
              <svg className="w-full h-24 mx-auto text-indigo-300" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* 조명 및 무대 단상 */}
                <path d="M40 90 L360 90 L380 120 L20 120 Z" fill="#475569" />
                <rect x="70" y="80" width="260" height="12" rx="3" fill="#64748B" />
                {/* 의자 줄지어 놓기 */}
                <rect x="50" y="100" width="18" height="15" rx="2" fill="#94A3B8" />
                <rect x="80" y="100" width="18" height="15" rx="2" fill="#94A3B8" />
                <rect x="110" y="100" width="18" height="15" rx="2" fill="#94A3B8" />
                <rect x="270" y="100" width="18" height="15" rx="2" fill="#94A3B8" />
                <rect x="300" y="100" width="18" height="15" rx="2" fill="#94A3B8" />
                <rect x="330" y="100" width="18" height="15" rx="2" fill="#94A3B8" />
                {/* 의자를 나르고 풍선을 다는 학생 실루엣 3명 */}
                {/* 학생 1 */}
                <circle cx="160" cy="65" r="7" fill="#F8FAFC" />
                <path d="M152 75 C152 72 168 72 168 75 L166 92 L154 92 Z" fill="#38BDF8" />
                {/* 학생 2 (풍선 조율) */}
                <circle cx="200" cy="55" r="7" fill="#F8FAFC" />
                <path d="M192 65 C192 62 208 62 208 65 L206 85 L194 85 Z" fill="#F43F5E" />
                <circle cx="215" cy="40" r="8" fill="#F59E0B" />
                <circle cx="225" cy="45" r="7" fill="#10B981" />
                {/* 학생 3 */}
                <circle cx="240" cy="65" r="7" fill="#F8FAFC" />
                <path d="M232 75 C232 72 248 72 248 75 L246 92 L234 92 Z" fill="#A855F7" />
              </svg>
            </div>

            <div className="bg-black/50 backdrop-blur-xs py-1.5 px-3 rounded text-xs text-slate-300">
              사진 카드 (촬영 일시 및 촬영 장소는 표기되어 있지 않음)
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-base font-bold text-slate-800">
              “효성벼리 문화예술발표회를 준비하는 모습”
            </p>
          </div>
        </div>
      )}

      {/* 단서 8. 학교의 최종 알림장 */}
      {clueId === 8 && (
        <div className="bg-emerald-50/60 rounded-xl p-5 border-2 border-emerald-300 max-w-lg mx-auto font-sans">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2 mb-4">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              학교 공식 알림장 앱 공지
            </span>
            <span className="text-xs font-semibold text-emerald-700">게시일: 2026년 10월 29일</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-center text-emerald-950 mb-5">
            효성초등학교 효성벼리 문화예술발표회 최종 안내
          </h3>

          <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm text-slate-900 leading-relaxed text-base font-medium space-y-3">
            <p className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-emerald-950 font-bold">
              “효성벼리 문화예술발표회는 예정대로 2026년 10월 30일(금) 오전 9시 50분에 강당에서 진행합니다. 행사 관련 변경 사항은 학교의 공식 안내를 통해 확인해 주세요.”
            </p>
          </div>

          <div className="mt-6 pt-3 border-t border-emerald-200 text-center">
            <p className="text-sm font-bold text-slate-900">효 성 초 등 학 교</p>
          </div>
        </div>
      )}
    </div>
  );
};

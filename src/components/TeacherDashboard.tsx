import React, { useState } from 'react';
import { SubmittedNotebook, ClassTimerState, StudentRealtimeProgress } from '../types';
import { CLUES } from '../data/clues';
import {
  Users,
  Award,
  BookOpen,
  ArrowLeft,
  Printer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Sparkles,
  MessageSquare,
  Eye,
  EyeOff,
  Filter,
  Lock,
  Clock,
  Play,
  Square,
  RotateCcw,
  Plus,
  Minus,
  Folder,
  FolderOpen,
  Shuffle,
  Share2,
  UserCheck,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  Check,
  KeyRound,
  Trash2,
  X,
  ShieldAlert
} from 'lucide-react';

interface TeacherDashboardProps {
  notebooks: SubmittedNotebook[];
  onBackToApp: () => void;
  onUpdateFeedback: (notebookId: string, feedback: string) => void;
  onLockTeacherMode: () => void;
  classTimer: ClassTimerState;
  remainingSeconds: number;
  onStartTimer: (minutes?: number) => void;
  onStopTimer: () => void;
  onResetTimer: (minutes?: number) => void;
  onAddMinutes: (minutes: number) => void;
  onAssignStudentToGroup: (notebookId: string, groupId: number | null) => void;
  onBatchAutoDistribute: () => void;
  onAddSampleStudents?: () => void;
  onOpenGroupShare?: (groupId?: number) => void;
  currentPin?: string;
  onChangePin?: (newPin: string) => void;
  onClearAllSubmissions?: () => void;
  stage2Unlocked: boolean;
  onToggleStage2Lock: (unlocked: boolean) => void;
  realtimeStudents: Record<string, StudentRealtimeProgress>;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  notebooks,
  onBackToApp,
  onUpdateFeedback,
  onLockTeacherMode,
  classTimer,
  remainingSeconds,
  onStartTimer,
  onStopTimer,
  onResetTimer,
  onAddMinutes,
  onAssignStudentToGroup,
  onBatchAutoDistribute,
  onAddSampleStudents,
  onOpenGroupShare,
  currentPin = '0224',
  onChangePin,
  onClearAllSubmissions,
  stage2Unlocked,
  onToggleStage2Lock,
  realtimeStudents
}) => {
  const [dashboardTab, setDashboardTab] = useState<'notebooks' | 'groups'>('notebooks');
  const [selectedId, setSelectedId] = useState<string>(
    notebooks.length > 0 ? notebooks[0].id : ''
  );
  const [showTeacherGuide, setShowTeacherGuide] = useState<boolean>(true);
  const [filterTrust, setFilterTrust] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(classTimer.durationMinutes || 25);
  const [selectedFolderGroup, setSelectedFolderGroup] = useState<number | 'unassigned'>(1);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // 비밀번호 변경 모달 상태 (원래 비밀번호 필수 확인)
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState<boolean>(false);
  const [oldPinInput, setOldPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPinInput !== currentPin) {
      setPinError('현재(기존) 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
      return;
    }
    if (newPinInput.length < 4) {
      setPinError('새 비밀번호는 4자리 이상이어야 합니다.');
      return;
    }
    if (newPinInput === oldPinInput) {
      setPinError('새 비밀번호는 기존 비밀번호와 다르게 설정해 주세요.');
      return;
    }
    if (newPinInput !== confirmNewPinInput) {
      setPinError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (onChangePin) {
      onChangePin(newPinInput);
    }
    setPinSuccess('교사용 비밀번호가 성공적으로 변경되었습니다!');
    setTimeout(() => {
      setIsChangePinModalOpen(false);
      setPinSuccess(null);
      setOldPinInput('');
      setNewPinInput('');
      setConfirmNewPinInput('');
      setPinError(null);
    }, 1500);
  };

  const handleClearSubmissions = () => {
    if (window.confirm('⚠️ 정말 현재 공유방과 대시보드에 등록된 모든 학생 수첩을 삭제하시겠습니까? (0명으로 완전히 비워집니다)')) {
      if (onClearAllSubmissions) {
        onClearAllSubmissions();
      }
      showNotice('🗑️ 공유방의 모든 학생 제출 수첩이 삭제되었습니다. (현재 0명)');
    }
  };

  const showNotice = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const formatTime = (totalSec: number) => {
    if (totalSec <= 0) return '00:00';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedNotebook = notebooks.find((n) => n.id === selectedId) || notebooks[0];

  const filteredNotebooks = notebooks.filter((n) => {
    if (filterTrust !== 'all' && n.activity2.rumorTrustLevel !== filterTrust) {
      return false;
    }
    if (filterGroup !== 'all') {
      if (filterGroup === 'unassigned') {
        if (n.groupId) return false;
      } else {
        if (n.groupId !== Number(filterGroup)) return false;
      }
    }
    return true;
  });

  const trustStatCount = {
    hardToBelieve: notebooks.filter((n) => n.activity2.rumorTrustLevel === '믿기 어렵다.').length,
    needCheck: notebooks.filter((n) => n.activity2.rumorTrustLevel === '더 확인해야 한다.').length,
    believable: notebooks.filter((n) => n.activity2.rumorTrustLevel === '믿을 만하다.').length
  };

  // Group counts
  const groupCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let unassignedCount = 0;
  notebooks.forEach((n) => {
    if (n.groupId && n.groupId >= 1 && n.groupId <= 5) {
      groupCounts[n.groupId] = (groupCounts[n.groupId] || 0) + 1;
    } else {
      unassignedCount++;
    }
  });

  // 실시간 접속 학생 및 제출된 학생 통합 목록
  interface UnifiedStudentProgress {
    studentName: string;
    studentGroup: number;
    stage1Count: number; // 0~4
    stage1Completed: boolean;
    stage2Count: number; // 0~4
    stage2Completed: boolean;
    allCluesCount: number; // 0~8
    isSubmitted: boolean;
    lastActiveText: string;
    currentClueNumber: number;
  }

  const studentMap = new Map<string, UnifiedStudentProgress>();

  // 1. realtimeStudents에서 데이터 수집
  Object.values(realtimeStudents || {}).forEach((s) => {
    if (!s.studentName) return;
    const s1Count = [1, 2, 3, 4].filter((id) => {
      const r = s.clueResponses?.[id];
      return Boolean(r && r.trustLevel && r.reason?.trim());
    }).length;
    const s2Count = [5, 6, 7, 8].filter((id) => {
      const r = s.clueResponses?.[id];
      return Boolean(r && r.trustLevel && r.reason?.trim());
    }).length;

    const diffSec = Math.floor((Date.now() - (s.lastActive || Date.now())) / 1000);
    const lastActiveText =
      diffSec < 10 ? '방금 전' : diffSec < 60 ? `${diffSec}초 전` : `${Math.floor(diffSec / 60)}분 전`;

    studentMap.set(s.studentName, {
      studentName: s.studentName,
      studentGroup: s.studentGroup || 1,
      stage1Count: s1Count,
      stage1Completed: s1Count === 4,
      stage2Count: s2Count,
      stage2Completed: s2Count === 4,
      allCluesCount: s1Count + s2Count,
      isSubmitted: Boolean(s.isSubmitted),
      lastActiveText,
      currentClueNumber: Math.min(8, (s.currentClueIdx ?? 0) + 1)
    });
  });

  // 2. 제출된 notebooks에서도 보강 (아직 realtime에 없거나 제출된 학생)
  notebooks.forEach((nb) => {
    if (!nb.studentName) return;
    if (!studentMap.has(nb.studentName)) {
      const s1Count = [1, 2, 3, 4].filter((id) => {
        const r = nb.clueResponses?.[id];
        return Boolean(r && r.trustLevel && r.reason?.trim());
      }).length;
      const s2Count = [5, 6, 7, 8].filter((id) => {
        const r = nb.clueResponses?.[id];
        return Boolean(r && r.trustLevel && r.reason?.trim());
      }).length;

      studentMap.set(nb.studentName, {
        studentName: nb.studentName,
        studentGroup: nb.groupId || 1,
        stage1Count: s1Count,
        stage1Completed: s1Count === 4,
        stage2Count: s2Count,
        stage2Completed: s2Count === 4,
        allCluesCount: s1Count + s2Count,
        isSubmitted: true,
        lastActiveText: '제출 완료',
        currentClueNumber: 8
      });
    } else {
      const existing = studentMap.get(nb.studentName)!;
      existing.isSubmitted = true;
    }
  });

  const allStudents = Array.from(studentMap.values());
  const totalStudentsCount = allStudents.length;
  const stage1CompletedStudents = allStudents.filter((s) => s.stage1Completed);
  const stage1IncompleteStudents = allStudents.filter((s) => !s.stage1Completed);
  const stage1CompletedCount = stage1CompletedStudents.length;
  const stage1IncompleteCount = stage1IncompleteStudents.length;
  const isAllStage1Done = totalStudentsCount > 0 && stage1IncompleteCount === 0;

  return (
    <div className="max-w-6xl mx-auto py-4 px-4 font-sans">
      {/* 상단 컨트롤 바 */}
      <div className="no-print bg-indigo-900 text-white rounded-3xl p-5 mb-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-700 flex items-center justify-center text-white shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-xs font-bold px-2.5 py-0.5 rounded-full">
                교사용 전용 지도 화면
              </span>
              <span className="text-xs text-indigo-200">총 제출: {notebooks.length}명</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              효성초등학교 팩트 탐정단 지도 & 1~5조 폴더 관리
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenGroupShare && (
            <button
              onClick={() => onOpenGroupShare(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 transition shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>조별 공유방 학생 화면 가기</span>
            </button>
          )}

          <button
            onClick={() => setIsChangePinModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-800 text-indigo-100 hover:bg-indigo-700 transition border border-indigo-600 shadow-sm cursor-pointer"
            title="교사용 비밀번호 변경"
          >
            <KeyRound className="w-4 h-4 text-amber-300" />
            <span>비밀번호 변경</span>
          </button>

          {onClearAllSubmissions && (
            <button
              onClick={handleClearSubmissions}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-800/80 hover:bg-rose-700 text-rose-100 transition border border-rose-600 shadow-sm cursor-pointer"
              title="공유방 학생 모두 비우기"
            >
              <Trash2 className="w-4 h-4 text-rose-300" />
              <span>공유방 비우기</span>
            </button>
          )}

          <button
            onClick={() => setShowTeacherGuide(!showTeacherGuide)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
              showTeacherGuide
                ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-sm'
                : 'bg-indigo-800 text-indigo-200 border-indigo-700 hover:bg-indigo-700'
            }`}
          >
            {showTeacherGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>지도 포인트 {showTeacherGuide ? '숨기기' : '보기'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-indigo-950 hover:bg-slate-100 transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>이 수첩 인쇄</span>
          </button>

          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-700 hover:bg-indigo-600 text-white transition border border-indigo-500/50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>학생 화면으로</span>
          </button>

          <button
            onClick={onLockTeacherMode}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
          >
            <Lock className="w-4 h-4" />
            <span>교사 모드 잠그기</span>
          </button>
        </div>
      </div>

      {/* 액션 안내 알림 토스트 */}
      {actionSuccessMsg && (
        <div className="no-print mb-4 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 교사 탭 네비게이션: 수첩 개별 점검 vs 1~5조 폴더 관리 */}
      <div className="no-print flex items-center justify-between border-b-2 border-slate-200 mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDashboardTab('notebooks')}
            className={`flex items-center gap-2 px-5 py-3 font-black text-sm border-b-2 -mb-[2px] transition cursor-pointer ${
              dashboardTab === 'notebooks'
                ? 'border-indigo-600 text-indigo-950 bg-indigo-50/60 rounded-t-2xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>개별 학생 수첩 점검 & 피드백 ({notebooks.length}명)</span>
          </button>

          <button
            onClick={() => setDashboardTab('groups')}
            className={`flex items-center gap-2 px-5 py-3 font-black text-sm border-b-2 -mb-[2px] transition cursor-pointer ${
              dashboardTab === 'groups'
                ? 'border-indigo-600 text-indigo-950 bg-amber-50/70 rounded-t-2xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-600" />
            <span>📁 1~5조 조별 폴더 관리 및 이동</span>
            {unassignedCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                미배정 {unassignedCount}명
              </span>
            )}
          </button>
        </div>

        {dashboardTab === 'groups' && (
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => {
                onBatchAutoDistribute();
                showNotice('⚡ 모든 학생이 1~5조로 균등하게 자동 배정되었습니다!');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>1~5조 균등 자동 배정</span>
            </button>

            {onAddSampleStudents && notebooks.length < 5 && (
              <button
                onClick={() => {
                  onAddSampleStudents();
                  showNotice('🧪 테스트용 예시 학생 10명이 생성되어 등록되었습니다!');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>예시 학생 10명 생성 (테스트)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 수업 타이머 패널 */}
      <div className="no-print bg-white rounded-3xl border-2 border-indigo-200 p-5 mb-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-indigo-100">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
              classTimer.isRunning ? 'bg-amber-500 animate-pulse' : classTimer.isExpired ? 'bg-red-500' : 'bg-indigo-600'
            }`}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  classTimer.isRunning
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : classTimer.isExpired
                    ? 'bg-red-100 text-red-900 border border-red-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {classTimer.isRunning
                    ? '⏳ 수업 진행 중 (학생 작성 가능)'
                    : classTimer.isExpired
                    ? '⏰ 활동 시간 종료 (자동 제출 완료)'
                    : '⏸️ 시작 대기 중'}
                </span>
                <span className="text-xs font-semibold text-indigo-900">
                  설정 시간: <strong>{classTimer.durationMinutes || 25}분</strong>
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
                  {formatTime(remainingSeconds)}
                </span>
                <span className="text-xs text-slate-500">
                  (종료 시점까지 작성한 내용이 학생 수첩에 자동 제출됩니다)
                </span>
              </div>
            </div>
          </div>

          {/* 타이머 액션 버튼들 */}
          <div className="flex items-center gap-2 flex-wrap">
            {!classTimer.isRunning ? (
              <button
                onClick={() => onStartTimer(customMinutesInput)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>▶ {customMinutesInput}분 활동 시작하기</span>
              </button>
            ) : (
              <button
                onClick={onStopTimer}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-700 hover:bg-slate-800 transition shadow-sm cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>일시 중지</span>
              </button>
            )}

            <button
              onClick={() => onAddMinutes(5)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer"
              title="5분 연장"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              <span>+5분</span>
            </button>

            <button
              onClick={() => onAddMinutes(-5)}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 transition cursor-pointer"
              title="5분 단축"
            >
              <Minus className="w-3.5 h-3.5 text-slate-600" />
              <span>-5분</span>
            </button>

            <button
              onClick={() => onResetTimer(customMinutesInput)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              <span>{customMinutesInput}분으로 초기화</span>
            </button>
          </div>
        </div>

        {/* 시간 직접 입력 및 프리셋 선택 바 */}
        <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700">⏱️ 활동 시간 직접 입력:</span>
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border-2 border-indigo-300 shadow-xs">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutesInput}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCustomMinutesInput(isNaN(val) ? 1 : Math.max(1, Math.min(180, val)));
                  }}
                  className="w-14 text-center font-mono font-black text-sm text-indigo-900 focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-600">분</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 mr-1">빠른 선택:</span>
              {[10, 15, 20, 25, 30, 40, 50].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setCustomMinutesInput(mins);
                    onResetTimer(mins);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    customMinutesInput === mins
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {mins}분
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onResetTimer(customMinutesInput)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>{customMinutesInput}분으로 시간 재설정</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🚦 구간별 진행 잠금 & 1단계(단서 1~4) 실시간 완료 현황판 */}
      <div
        className={`no-print rounded-3xl border-2 sm:border-4 p-5 sm:p-6 mb-6 shadow-xl transition-all ${
          stage2Unlocked
            ? 'bg-emerald-50/70 border-emerald-300'
            : isAllStage1Done
            ? 'bg-amber-50/90 border-amber-400 ring-4 ring-amber-300/40'
            : 'bg-white border-indigo-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md ${
                stage2Unlocked ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
            >
              {stage2Unlocked ? '🔓' : '🔒'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                  수업 속도 조절 기능
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                    stage2Unlocked
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {stage2Unlocked ? '2단계(단서 5~8) 열림 상태' : '2단계(단서 5~8) 잠김 상태'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                🚦 구간별 진행 잠금 & 1단계(단서 1~4) 실시간 완료 현황판
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                모든 학생이 단서 1~4번을 마칠 때까지 5번 단서 접근을 차단합니다. 교사가 아래 버튼을 눌러야 모든 학생 노트북에서 2단계가 시작됩니다.
              </p>
            </div>
          </div>

          {/* 5~8번 활동 시작 제어 버튼 */}
          <div className="flex items-center gap-3">
            {!stage2Unlocked ? (
              <button
                type="button"
                onClick={() => {
                  onToggleStage2Lock(true);
                  showNotice('🚀 5~8번 활동이 시작되었습니다! 모든 학생 기기에서 2단계 잠금이 해제되었습니다.');
                }}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg transition cursor-pointer ${
                  isAllStage1Done
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-4 ring-emerald-300 animate-bounce'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                }`}
              >
                <Play className="w-5 h-5 fill-white" />
                <span>
                  {isAllStage1Done
                    ? '🎉 전원 1단계 완료! 5~8번 활동 시작'
                    : '5~8번 활동 시작 (2단계 잠금 해제)'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onToggleStage2Lock(false);
                  showNotice('🔒 2단계가 다시 잠겼습니다. 학생들은 단서 1~4번까지만 열람할 수 있습니다.');
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-400 shadow-sm transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-900" />
                <span>2단계 다시 잠그기 (1~4번으로 제한)</span>
              </button>
            )}
          </div>
        </div>

        {/* 1단계 완료 인원 vs 미완료 인원 진척도 바 */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-bold gap-2">
            <span className="text-slate-800 flex items-center gap-1.5">
              <span>📊 1단계(단서 1~4) 조사 진척도:</span>
              <strong className="text-base font-black text-indigo-700">
                {totalStudentsCount > 0
                  ? `${totalStudentsCount}명 중 ${stage1CompletedCount}명 완료`
                  : '0명 접속 중'}
              </strong>
              {totalStudentsCount > 0 && (
                <span className="text-xs text-slate-500">
                  ({Math.round((stage1CompletedCount / totalStudentsCount) * 100)}%)
                </span>
              )}
            </span>

            <div className="flex items-center gap-3">
              <span className="text-emerald-700 font-black flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>완료: {stage1CompletedCount}명</span>
              </span>
              <span
                className={`font-black flex items-center gap-1 ${
                  stage1IncompleteCount > 0 ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>미완료(진행 중): {stage1IncompleteCount}명</span>
              </span>
            </div>
          </div>

          {/* 게이지 바 */}
          <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden shadow-inner flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{
                width: `${
                  totalStudentsCount > 0 ? (stage1CompletedCount / totalStudentsCount) * 100 : 0
                }%`
              }}
            />
          </div>

          {/* 학생별 세부 진도 현황 (완료자 & 미완료자) */}
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 미완료 학생 태그 */}
            <div className="bg-white/80 p-3.5 rounded-2xl border border-rose-200 space-y-2">
              <span className="font-black text-rose-800 block text-xs flex items-center justify-between">
                <span>⏳ 1단계 진행 중인 학생 ({stage1IncompleteCount}명)</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  도움이 필요한 학생을 확인하세요
                </span>
              </span>
              {stage1IncompleteCount === 0 ? (
                <p className="text-[11px] text-emerald-700 font-bold py-1">
                  {totalStudentsCount === 0
                    ? '학생이 노트북에서 이름을 입력하고 활동을 시작하면 실시간으로 표시됩니다.'
                    : '🎉 모든 학생이 1단계를 완료했습니다! 5~8번 활동 시작 버튼을 눌러 2단계를 열어주세요.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stage1IncompleteStudents.map((st) => (
                    <span
                      key={st.studentName}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-300 font-bold text-xs"
                    >
                      <span>{st.studentName}</span>
                      <span className="text-[10px] px-1 py-0.5 rounded bg-white text-rose-700 border border-rose-200">
                        {st.stage1Count}/4개 (단서 {st.currentClueNumber})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 완료 학생 태그 */}
            <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-200 space-y-2">
              <span className="font-black text-emerald-800 block text-xs flex items-center justify-between">
                <span>✓ 1단계 완료 학생 ({stage1CompletedCount}명)</span>
                <span className="text-[11px] text-emerald-600 font-semibold">2단계 시작 대기 중</span>
              </span>
              {stage1CompletedCount === 0 ? (
                <p className="text-[11px] text-slate-400 py-1">아직 1단계를 완료한 학생이 없습니다.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stage1CompletedStudents.map((st) => (
                    <span
                      key={st.studentName}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{st.studentName}</span>
                      <span className="text-[10px] opacity-75">({st.studentGroup}조)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 학급 종합 통계 카드 */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">총 제출 인원</span>
          <span className="text-2xl font-black text-slate-900">{notebooks.length}명</span>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 block mb-1">‘믿기 어렵다’ 판단</span>
          <span className="text-2xl font-black text-emerald-700">
            {trustStatCount.hardToBelieve}명 ({notebooks.length > 0 ? Math.round((trustStatCount.hardToBelieve / notebooks.length) * 100) : 0}%)
          </span>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 shadow-xs">
          <span className="text-xs font-bold text-amber-800 block mb-1">‘더 확인해야 한다’ 판단</span>
          <span className="text-2xl font-black text-amber-700">
            {trustStatCount.needCheck}명 ({notebooks.length > 0 ? Math.round((trustStatCount.needCheck / notebooks.length) * 100) : 0}%)
          </span>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border-2 border-rose-200 shadow-xs">
          <span className="text-xs font-bold text-rose-800 block mb-1">‘믿을 만하다’ 판단</span>
          <span className="text-2xl font-black text-rose-700">
            {trustStatCount.believable}명 ({notebooks.length > 0 ? Math.round((trustStatCount.believable / notebooks.length) * 100) : 0}%)
          </span>
        </div>
      </div>

      {/* VIEW 1: 개별 학생 수첩 점검 & 피드백 뷰 */}
      {dashboardTab === 'notebooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측: 제출된 학생 목록 사이드바 */}
          <div className="no-print lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>제출된 학생 목록</span>
                </h2>

                <div className="flex items-center gap-1.5">
                  {/* 조 필터 */}
                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                    title="조별 필터"
                  >
                    <option value="all">전체 조</option>
                    <option value="1">1조</option>
                    <option value="2">2조</option>
                    <option value="3">3조</option>
                    <option value="4">4조</option>
                    <option value="5">5조</option>
                    <option value="unassigned">미배정</option>
                  </select>

                  {/* 판단 필터 */}
                  <select
                    value={filterTrust}
                    onChange={(e) => setFilterTrust(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="all">전체 판단</option>
                    <option value="믿기 어렵다.">믿기 어렵다</option>
                    <option value="더 확인해야 한다.">더 확인</option>
                    <option value="믿을 만하다.">믿을 만하다</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredNotebooks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    해당 조건의 학생 제출물이 없습니다.
                  </p>
                ) : (
                  filteredNotebooks.map((nb) => {
                    const isSelected = nb.id === selectedNotebook?.id;
                    return (
                      <button
                        key={nb.id}
                        onClick={() => setSelectedId(nb.id)}
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition flex flex-col gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-400'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                            <span>👤 {nb.studentName || '이름 미입력 학생'}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                nb.groupId
                                  ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {nb.groupId ? `${nb.groupId}조` : '미배정'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                nb.activity2.rumorTrustLevel === '믿기 어렵다.'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : nb.activity2.rumorTrustLevel === '더 확인해야 한다.'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {nb.activity2.rumorTrustLevel || '미선택'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>제출: {nb.submittedAt}</span>
                          {nb.teacherFeedback && (
                            <span className="text-indigo-600 font-bold">✓ 피드백 작성됨</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* 교사용 관찰 가이드 요약 카드 (접이식) */}
            {showTeacherGuide && (
              <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-4 shadow-sm text-xs space-y-3">
                <h3 className="font-extrabold text-amber-950 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>단서별 지도 핵심 관찰 포인트</span>
                </h3>
                <div className="space-y-2 text-slate-700">
                  {CLUES.map((c) => (
                    <div key={c.id} className="border-b border-amber-200/60 pb-1.5">
                      <span className="font-bold text-amber-900 block">{c.title}</span>
                      <ul className="list-disc list-inside text-slate-600 pl-1">
                        {c.teacherObservationPoints.map((pt, idx) => (
                          <li key={idx} className="leading-tight text-[11px]">
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 우측: 선택된 학생의 수첩 상세 뷰 */}
          <div className="lg:col-span-8">
            {selectedNotebook ? (
              <div className="bg-white rounded-3xl border-2 sm:border-4 border-amber-200/90 p-6 sm:p-8 shadow-xl text-slate-900">
                {/* 상단 학생 식별 바 & 조 배정 컨트롤 */}
                <div className="border-b-4 border-amber-500 pb-4 mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
                        학생 제출 수첩 점검
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        제출 일시: {selectedNotebook.submittedAt}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      <span>🕵️ {selectedNotebook.studentName || '이름 미입력 학생'}의 탐정 수첩</span>
                    </h2>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500 block">소문 최종 판단</span>
                      <span className="inline-block mt-0.5 px-3 py-1 rounded-xl text-sm font-black bg-indigo-600 text-white shadow-xs">
                        {selectedNotebook.activity2.rumorTrustLevel || '판단 없음'}
                      </span>
                    </div>

                    {/* 조 배정 스위처 */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-black text-slate-700 pl-1">소속 조:</span>
                      {[1, 2, 3, 4, 5].map((g) => (
                        <button
                          key={g}
                          onClick={() => {
                            onAssignStudentToGroup(selectedNotebook.id, g);
                            showNotice(`✓ ${selectedNotebook.studentName} 학생을 ${g}조 폴더로 이동했습니다.`);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-xs font-black transition cursor-pointer ${
                            selectedNotebook.groupId === g
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {g}조
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          onAssignStudentToGroup(selectedNotebook.id, null);
                          showNotice(`✓ ${selectedNotebook.studentName} 학생을 미배정으로 변경했습니다.`);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          !selectedNotebook.groupId
                            ? 'bg-slate-700 text-white'
                            : 'bg-white hover:bg-slate-200 text-slate-500'
                        }`}
                      >
                        해제
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1부: 단서 1~8 특징 및 신뢰도 기록 */}
                <section className="mb-8">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
                    <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-xs flex items-center justify-center font-black">
                      1
                    </span>
                    <span>단서 1~8 탐색 및 신뢰도 기록</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {CLUES.map((clue) => {
                      const res = selectedNotebook.clueResponses[clue.id];
                      return (
                        <div
                          key={clue.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-slate-900">{clue.title}</span>
                              <span
                                className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                                  res?.trustLevel
                                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                1. 신뢰도: {res?.trustLevel || '미선택'}
                              </span>
                            </div>

                            <div className="mt-1">
                              <span className="font-bold text-slate-700 block mb-0.5">
                                • 2. 그렇게 생각한 까닭:
                              </span>
                              <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                                {res?.reason || '(까닭 미작성)'}
                              </p>
                            </div>

                            {res?.features && (
                              <div className="mt-1 text-[11px] text-slate-500">
                                <span className="font-semibold">• 이전 기록 특징: </span>
                                <span>{res.features}</span>
                              </div>
                            )}
                          </div>

                          {showTeacherGuide && (
                            <div className="mt-2 pt-2 border-t border-amber-200/80 text-[11px] text-amber-900 bg-amber-50/60 p-1.5 rounded">
                              <span className="font-bold">💡 교사용 관찰점: </span>
                              {clue.teacherObservationPoints.join(' / ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 2부: 활동 2 - 신뢰성 판단 */}
                <section className="mb-8">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-xs flex items-center justify-center font-black">
                      2
                    </span>
                    <span>활동 2: 신뢰성 판단 결과 및 근거</span>
                  </h3>

                  <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-200 space-y-3 text-xs sm:text-sm">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">
                        질문 1. 소문 신뢰도 판단:
                      </span>
                      <span className="font-extrabold text-indigo-900 bg-white px-3 py-1 rounded-lg border border-indigo-300 inline-block">
                        👉 {selectedNotebook.activity2.rumorTrustLevel}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">
                        질문 2. 그렇게 판단한 이유:
                      </span>
                      <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {selectedNotebook.activity2.reason || '(작성된 근거 없음)'}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">
                        질문 3. 판단에 가장 중요했던 단서:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNotebook.activity2.importantClueIds.length > 0 ? (
                          selectedNotebook.activity2.importantClueIds.map((id) => {
                            const clue = CLUES.find((c) => c.id === id);
                            return (
                              <span
                                key={id}
                                className="px-2.5 py-1 bg-white border border-indigo-300 text-indigo-900 font-bold rounded-md text-xs shadow-2xs"
                              >
                                ✓ {clue?.title}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-slate-400 text-xs">(선택 없음)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3부: 활동 3 - 최종 추리 질문 */}
                <section className="mb-8">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-xs flex items-center justify-center font-black">
                      3
                    </span>
                    <span>활동 3: 최종 추리 및 올바른 태도</span>
                  </h3>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                      <span className="font-bold text-slate-900 block mb-1">
                        질문 1. 효성벼리 문화예술발표회 취소 소문을 믿고 친구에게 전달하면 어떤 문제가 생길까?
                      </span>
                      <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {selectedNotebook.activity3.q1SpreadProblem || '(답변 없음)'}
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                      <span className="font-bold text-slate-900 block mb-1">
                        질문 2. 놀랍거나 급한 정보를 보았을 때 어떤 태도를 가져야 할까?
                      </span>
                      <p className="bg-white p-3 rounded-lg border border-slate-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {selectedNotebook.activity3.q2Attitude || '(답변 없음)'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 4부: 교사 피드백 작성란 */}
                <section className="no-print pt-4 border-t-2 border-slate-200">
                  <label className="block text-sm font-extrabold text-indigo-950 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>선생님의 칭찬과 피드백 코멘트</span>
                  </label>
                  <textarea
                    value={selectedNotebook.teacherFeedback || ''}
                    onChange={(e) => onUpdateFeedback(selectedNotebook.id, e.target.value)}
                    placeholder="예: 단서 4의 출처 누락과 단서 8의 공식 알림장 날짜를 꼼꼼하게 비교해서 훌륭한 추리를 해주었습니다! 칭찬합니다."
                    rows={3}
                    className="w-full p-3 text-xs sm:text-sm rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none transition leading-relaxed bg-indigo-50/30 text-slate-900"
                  />
                </section>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border-2 border-slate-200 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  아직 제출된 학생 수첩이 없습니다
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  학생들이 8개 단서를 탐색하고 최종 추리(활동 3)를 제출하면, 이곳에 학생 이름과 함께 수첩 기록이 실시간으로 등록됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: 📁 1~5조 조별 폴더 관리 및 학생 이동 뷰 */}
      {dashboardTab === 'groups' && (
        <div className="space-y-6">
          {/* 가이드 배너 */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">
                  교사 조별 배정 시스템
                </span>
                <span className="text-xs font-bold text-amber-900">
                  총 {notebooks.length}명 중 {notebooks.length - unassignedCount}명 배정 완료 (미배정 {unassignedCount}명)
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                학생들이 제출한 수첩을 1~5조 폴더로 옮겨주세요
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                선생님이 학생을 각 조로 배정하면, 학생들은 자신의 조 결과 공유방에 들어가 친구들의 수첩을 열람하고 토론할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onBatchAutoDistribute();
                  showNotice('⚡ 모든 학생이 1~5조로 균등하게 자동 배정되었습니다!');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>1~5조 균등 자동 배정</span>
              </button>
            </div>
          </div>

          {/* 1~5조 폴더 현황 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((gNum) => {
              const count = groupCounts[gNum] || 0;
              const isSelected = selectedFolderGroup === gNum;
              return (
                <button
                  key={gNum}
                  onClick={() => setSelectedFolderGroup(gNum)}
                  className={`p-4 rounded-2xl border-2 transition text-left flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100/70 border-amber-500 shadow-md ring-2 ring-amber-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">📁</span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        count > 0 ? 'bg-indigo-100 text-indigo-900' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {count}명
                    </span>
                  </div>
                  <div>
                    <h4 className="font-black text-base text-slate-900">{gNum}조 폴더</h4>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {count > 0 ? `${count}명 배정됨` : '비어 있음'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 미배정 학생 대기실 (미배정 학생이 있는 경우 노출) */}
          {unassignedCount > 0 && (
            <div className="bg-rose-50/70 border-2 border-rose-300 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-200">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center">
                    !
                  </span>
                  <h4 className="font-black text-base text-rose-950">
                    아직 조가 배정되지 않은 학생 ({unassignedCount}명)
                  </h4>
                </div>
                <span className="text-xs text-rose-700 font-bold">
                  원하는 조 번호(1~5) 버튼을 누르면 해당 조 폴더로 즉시 이동합니다
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {notebooks
                  .filter((n) => !n.groupId)
                  .map((unassignedStudent) => (
                    <div
                      key={unassignedStudent.id}
                      className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">
                          👤 {unassignedStudent.studentName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {unassignedStudent.activity2.rumorTrustLevel || '미선택'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-500">배정하기:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((targetGroup) => (
                            <button
                              key={targetGroup}
                              onClick={() => {
                                onAssignStudentToGroup(unassignedStudent.id, targetGroup);
                                showNotice(`✓ ${unassignedStudent.studentName} 학생을 ${targetGroup}조 폴더로 이동했습니다.`);
                              }}
                              className="px-2 py-1 rounded-lg text-xs font-black bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-900 border border-indigo-200 transition cursor-pointer"
                              title={`${targetGroup}조로 이동`}
                            >
                              {targetGroup}조
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 선택된 조 폴더의 상세 관리 패널 */}
          <div className="bg-white rounded-3xl border-2 sm:border-4 border-amber-300 p-6 sm:p-7 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  📁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      {selectedFolderGroup}조 폴더에 배정된 학생 목록
                    </h3>
                    <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                      {notebooks.filter((n) => n.groupId === selectedFolderGroup).length}명
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    이곳의 학생들은 {selectedFolderGroup}조 결과 공유방에 모여 서로의 수첩을 확인하고 토론합니다.
                  </p>
                </div>
              </div>

              {onOpenGroupShare && (
                <button
                  onClick={() => onOpenGroupShare(typeof selectedFolderGroup === 'number' ? selectedFolderGroup : 1)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{selectedFolderGroup}조 학생 공유방 화면 열기</span>
                </button>
              )}
            </div>

            {/* 폴더 내부 학생 리스트 */}
            {notebooks.filter((n) => n.groupId === selectedFolderGroup).length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-sm font-bold text-slate-600">
                  현재 {selectedFolderGroup}조 폴더에 배정된 학생이 없습니다.
                </p>
                <p className="text-xs text-slate-400">
                  위의 ‘1~5조 균등 자동 배정’ 버튼을 누르거나, 미배정 학생 목록에서 {selectedFolderGroup}조를 클릭하여 학생을 옮겨주세요.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notebooks
                  .filter((n) => n.groupId === selectedFolderGroup)
                  .map((member) => (
                    <div
                      key={member.id}
                      className="bg-amber-50/40 p-4 rounded-2xl border-2 border-amber-200 shadow-xs flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-base text-slate-900">
                            👤 {member.studentName}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              member.activity2.rumorTrustLevel === '믿기 어렵다.'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : member.activity2.rumorTrustLevel === '더 확인해야 한다.'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {member.activity2.rumorTrustLevel || '미선택'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 line-clamp-2 leading-relaxed">
                          <strong>판단 이유:</strong> {member.activity2.reason || '(근거 없음)'}
                        </p>
                      </div>

                      {/* 다른 조로 옮기기 버튼 바 */}
                      <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500 text-[11px]">다른 조로 옮기기:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5]
                            .filter((g) => g !== selectedFolderGroup)
                            .map((otherGroup) => (
                              <button
                                key={otherGroup}
                                onClick={() => {
                                  onAssignStudentToGroup(member.id, otherGroup);
                                  showNotice(`✓ ${member.studentName} 학생을 ${otherGroup}조 폴더로 이동했습니다.`);
                                }}
                                className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white hover:bg-amber-100 text-slate-700 border border-slate-300 transition cursor-pointer"
                                title={`${otherGroup}조로 이동`}
                              >
                                {otherGroup}조
                              </button>
                            ))}
                          <button
                            onClick={() => {
                              onAssignStudentToGroup(member.id, null);
                              showNotice(`✓ ${member.studentName} 학생을 미배정으로 변경했습니다.`);
                            }}
                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600 transition cursor-pointer"
                            title="조 배정 취소"
                          >
                            제외
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* 교사용 비밀번호 변경 모달 (기존 비밀번호 필수 검증) */}
      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-indigo-200 max-w-md w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setIsChangePinModalOpen(false);
                setPinError(null);
                setPinSuccess(null);
                setOldPinInput('');
                setNewPinInput('');
                setConfirmNewPinInput('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <KeyRound className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  교사용 비밀번호(PIN) 변경
                </h3>
                <p className="text-xs text-slate-500">
                  원래 비밀번호를 입력해야 새 비밀번호로 변경할 수 있습니다.
                </p>
              </div>
            </div>

            {pinSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{pinSuccess}</span>
              </div>
            )}

            {pinError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleChangePinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>현재(기존) 비밀번호 확인</span>
                  <span className="text-[11px] text-rose-500 font-semibold">* 필수 입력</span>
                </label>
                <input
                  type="password"
                  autoFocus
                  value={oldPinInput}
                  onChange={(e) => {
                    setOldPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="현재 사용 중인 비밀번호"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  새 교사용 비밀번호 (4자리 이상)
                </label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => {
                    setNewPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="새 비밀번호 입력"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmNewPinInput}
                  onChange={(e) => {
                    setConfirmNewPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePinModalOpen(false);
                    setPinError(null);
                    setPinSuccess(null);
                    setOldPinInput('');
                    setNewPinInput('');
                    setConfirmNewPinInput('');
                  }}
                  className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition cursor-pointer shadow-sm"
                >
                  비밀번호 변경
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

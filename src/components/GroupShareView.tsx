import React, { useState } from 'react';
import { SubmittedNotebook, GroupComment, GroupConclusion } from '../types';
import { CLUES } from '../data/clues';
import {
  Users,
  Folder,
  FolderOpen,
  ArrowLeft,
  Printer,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Send,
  ThumbsUp,
  FileText,
  Table,
  LayoutGrid,
  Eye,
  X,
  Share2,
  BookmarkCheck,
  ChevronRight
} from 'lucide-react';

interface GroupShareViewProps {
  currentStudentName: string;
  studentGroup?: number;
  notebooks: SubmittedNotebook[];
  onBack: () => void;
  onAssignCurrentStudentGroup?: (groupId: number) => void;
  groupComments: GroupComment[];
  onAddComment: (comment: Omit<GroupComment, 'id' | 'createdAt' | 'likes'>) => void;
  onLikeComment: (commentId: string) => void;
  groupConclusions: Record<number, GroupConclusion>;
  onSaveConclusion: (conclusion: GroupConclusion) => void;
}

export const GroupShareView: React.FC<GroupShareViewProps> = ({
  currentStudentName,
  studentGroup,
  notebooks,
  onBack,
  onAssignCurrentStudentGroup,
  groupComments,
  onAddComment,
  onLikeComment,
  groupConclusions,
  onSaveConclusion
}) => {
  // Find current student's notebook and group if any
  const currentStudentNotebook = notebooks.find(
    (n) => n.studentName.trim() === currentStudentName.trim()
  );

  const initialGroup = currentStudentNotebook?.groupId || studentGroup || 1;
  const [activeGroup, setActiveGroup] = useState<number>(initialGroup);
  const [activeTab, setActiveTab] = useState<'members' | 'discussion' | 'conclusion'>('members');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedNotebookDetail, setSelectedNotebookDetail] = useState<SubmittedNotebook | null>(null);

  // Comment input state
  const [commentText, setCommentText] = useState<string>('');
  const [commentAuthor, setCommentAuthor] = useState<string>(currentStudentName || '');
  const [commentClueRef, setCommentClueRef] = useState<string>('');

  // Group conclusion state for the active group
  const existingConclusion = groupConclusions[activeGroup] || {
    groupId: activeGroup,
    consensusVerdict: '믿기 어렵다.',
    mainReason: '',
    keyClues: [8, 4],
    presentationNote: '',
    updatedAt: ''
  };

  const [conclusionVerdict, setConclusionVerdict] = useState<string>(existingConclusion.consensusVerdict);
  const [conclusionReason, setConclusionReason] = useState<string>(existingConclusion.mainReason);
  const [conclusionClues, setConclusionClues] = useState<number[]>(existingConclusion.keyClues || []);
  const [conclusionPresentation, setConclusionPresentation] = useState<string>(existingConclusion.presentationNote || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter notebooks for the active group
  const groupMembers = notebooks.filter((n) => n.groupId === activeGroup);

  // Group verdict stats
  const verdictCounts = {
    hardToBelieve: groupMembers.filter((n) => n.activity2.rumorTrustLevel === '믿기 어렵다.').length,
    needCheck: groupMembers.filter((n) => n.activity2.rumorTrustLevel === '더 확인해야 한다.').length,
    believable: groupMembers.filter((n) => n.activity2.rumorTrustLevel === '믿을 만하다.').length
  };

  // Clues cited in this group
  const clueFrequency: Record<number, number> = {};
  groupMembers.forEach((m) => {
    m.activity2.importantClueIds?.forEach((cId) => {
      clueFrequency[cId] = (clueFrequency[cId] || 0) + 1;
    });
  });

  const sortedCluesByFreq = Object.entries(clueFrequency)
    .map(([id, count]) => ({ id: Number(id), count }))
    .sort((a, b) => b.count - a.count);

  // Comments for this active group
  const activeGroupComments = groupComments.filter((c) => c.groupId === activeGroup);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment({
      groupId: activeGroup,
      author: commentAuthor.trim() || currentStudentName || '탐정',
      content: commentText.trim(),
      clueReference: commentClueRef || undefined
    });

    setCommentText('');
    setCommentClueRef('');
  };

  const handleSaveGroupConclusion = () => {
    const updated: GroupConclusion = {
      groupId: activeGroup,
      consensusVerdict: conclusionVerdict,
      mainReason: conclusionReason,
      keyClues: conclusionClues,
      presentationNote: conclusionPresentation,
      updatedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    onSaveConclusion(updated);
    setSaveSuccessMsg(`✓ ${activeGroup}조의 최종 결론과 발표 메모가 저장되었습니다!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handlePrintGroupSheet = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 font-sans">
      {/* 상단 컨트롤 바 */}
      <div className="no-print bg-indigo-900 text-white rounded-3xl p-5 mb-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center font-black text-xl shadow-md">
            👥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full">
                조별 활동 결과 공유
              </span>
              <span className="text-xs text-indigo-200">1~5조 모둠 협력 학습</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              팩트 탐정단 모둠 결과 공유방
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintGroupSheet}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-indigo-950 hover:bg-slate-100 transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>조별 보고서 인쇄</span>
          </button>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-700 hover:bg-indigo-600 text-white transition border border-indigo-500/50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>완료 화면으로</span>
          </button>
        </div>
      </div>

      {/* 1~5조 폴더 선택 탭 */}
      <div className="no-print mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-600 flex items-center gap-1">
            <Folder className="w-4 h-4 text-amber-600" />
            <span>공유할 조 폴더를 선택하세요 (1~5조):</span>
          </span>
          {currentStudentNotebook?.groupId || studentGroup ? (
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              📌 {currentStudentName || '탐정'}: <strong>{currentStudentNotebook?.groupId || studentGroup}조</strong> 배정됨
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
              선생님 배정 대기 또는 조 직접 선택 가능
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((gNum) => {
            const count = notebooks.filter((n) => n.groupId === gNum).length;
            const isSelected = activeGroup === gNum;
            const isMyGroup = (currentStudentNotebook?.groupId || studentGroup) === gNum;

            return (
              <button
                key={gNum}
                type="button"
                onClick={() => {
                  setActiveGroup(gNum);
                  // Update group conclusion inputs
                  const c = groupConclusions[gNum] || {
                    groupId: gNum,
                    consensusVerdict: '믿기 어렵다.',
                    mainReason: '',
                    keyClues: [8, 4],
                    presentationNote: '',
                    updatedAt: ''
                  };
                  setConclusionVerdict(c.consensusVerdict);
                  setConclusionReason(c.mainReason);
                  setConclusionClues(c.keyClues || []);
                  setConclusionPresentation(c.presentationNote || '');
                }}
                className={`p-3.5 rounded-2xl border-2 transition text-left flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {isMyGroup && (
                  <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                    나의 조
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {isSelected ? (
                    <FolderOpen className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Folder className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="font-black text-base text-slate-900">{gNum}조 폴더</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">제출 수첩</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-full ${
                      count > 0
                        ? 'bg-indigo-100 text-indigo-900 font-bold'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {count}명
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 현재 선택된 조 요약 정보 배너 */}
      <div className="bg-white rounded-3xl border-2 border-amber-300 p-5 sm:p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl border border-amber-300">
              {activeGroup}조
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeGroup}조 결과 공유 모둠 폴더
                </h2>
                <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                  총 {groupMembers.length}명 참여 중
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                모둠원들의 소문 신뢰성 판단과 근거를 비교하고, 토론하여 우리 조의 종합 결론을 내려보세요.
              </p>
            </div>
          </div>

          {/* 내가 이 조에 미등록된 경우 등록 버튼 */}
          {onAssignCurrentStudentGroup && currentStudentNotebook && currentStudentNotebook.groupId !== activeGroup && (
            <button
              onClick={() => onAssignCurrentStudentGroup(activeGroup)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>내 수첩을 {activeGroup}조로 이동/등록하기</span>
            </button>
          )}
        </div>

        {/* 조원 목록 칩 */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-600 mr-1">모둠원:</span>
          {groupMembers.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              아직 {activeGroup}조에 배정된 학생이 없습니다. 선생님께서 교사용 대시보드에서 학생을 {activeGroup}조로 옮겨주시거나 위 버튼으로 등록할 수 있습니다.
            </span>
          ) : (
            groupMembers.map((member) => (
              <span
                key={member.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-950"
              >
                <span>👤 {member.studentName}</span>
                <span className="text-[10px] text-indigo-600 font-normal">
                  ({member.activity2.rumorTrustLevel || '미선택'})
                </span>
              </span>
            ))
          )}
        </div>

        {/* 조별 의견 분포 & 핵심 단서 요약 통계 */}
        {groupMembers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-amber-100">
            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
              <span className="text-xs font-black text-slate-700 block mb-2">
                📊 {activeGroup}조 소문 신뢰성 판단 현황:
              </span>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  믿기 어렵다: {verdictCounts.hardToBelieve}명
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300">
                  더 확인 필요: {verdictCounts.needCheck}명
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                  믿을 만하다: {verdictCounts.believable}명
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200">
              <span className="text-xs font-black text-slate-700 block mb-2">
                🔍 {activeGroup}조가 가장 많이 주목한 핵심 단서:
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {sortedCluesByFreq.length > 0 ? (
                  sortedCluesByFreq.slice(0, 3).map((item) => {
                    const clue = CLUES.find((c) => c.id === item.id);
                    return (
                      <span
                        key={item.id}
                        className="px-2 py-0.5 rounded-md bg-white border border-indigo-300 text-indigo-900 font-bold"
                      >
                        ✓ {clue?.title} ({item.count}명)
                      </span>
                    );
                  })
                ) : (
                  <span className="text-slate-400 text-xs">단서 선택 데이터 없음</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3대 탭 네비게이션: 모둠원 수첩 열람 & 비교 / 토론 나누기 / 최종 결론 작성 */}
      <div className="no-print flex items-center justify-between border-b-2 border-slate-200 mb-6 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2.5 font-black text-sm border-b-2 -mb-[2px] transition cursor-pointer ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-950 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>모둠원 탐정 수첩 열람 & 비교 ({groupMembers.length}명)</span>
          </button>

          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex items-center gap-2 px-4 py-2.5 font-black text-sm border-b-2 -mb-[2px] transition cursor-pointer ${
              activeTab === 'discussion'
                ? 'border-indigo-600 text-indigo-950 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>우리 조 토론 & 한마디 ({activeGroupComments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conclusion')}
            className={`flex items-center gap-2 px-4 py-2.5 font-black text-sm border-b-2 -mb-[2px] transition cursor-pointer ${
              activeTab === 'conclusion'
                ? 'border-indigo-600 text-indigo-950 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>우리 조 종합 결론 & 발표 준비</span>
          </button>
        </div>

        {activeTab === 'members' && groupMembers.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="카드형으로 보기"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>카드형</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="한눈에 비교 표로 보기"
            >
              <Table className="w-3.5 h-3.5" />
              <span>비교 표</span>
            </button>
          </div>
        )}
      </div>

      {/* 탭 1: 모둠원 탐정 수첩 열람 & 비교 */}
      {activeTab === 'members' && (
        <div>
          {groupMembers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border-2 border-slate-200 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-3xl">
                📂
              </div>
              <h3 className="text-base font-black text-slate-800">
                현재 {activeGroup}조 폴더에 등록된 탐정 수첩이 없습니다
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                선생님이 교사용 수첩 화면에서 학생들의 수첩을 <strong>{activeGroup}조 폴더</strong>로 이동해주시면 친구들의 수첩을 함께 확인하고 비교할 수 있습니다.
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            /* 카드형 수첩 목록 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {groupMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-3xl border-2 border-amber-200/90 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* 상단 카드 헤더 */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center">
                          👤
                        </span>
                        <div>
                          <h4 className="font-black text-base text-slate-900">
                            {member.studentName}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            제출: {member.submittedAt}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full ${
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

                    {/* 활동 2: 소문 판단 이유 */}
                    <div className="mb-3">
                      <span className="text-xs font-bold text-slate-600 block mb-1">
                        💡 판단 근거:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 leading-relaxed font-medium line-clamp-3">
                        {member.activity2.reason || '(작성된 근거 없음)'}
                      </p>
                    </div>

                    {/* 선택한 핵심 단서 */}
                    <div className="mb-3">
                      <span className="text-xs font-bold text-slate-600 block mb-1">
                        🔍 주목한 핵심 단서:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {member.activity2.importantClueIds?.length > 0 ? (
                          member.activity2.importantClueIds.map((cId) => {
                            const c = CLUES.find((clue) => clue.id === cId);
                            return (
                              <span
                                key={cId}
                                className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold rounded-md"
                              >
                                {c?.title}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-slate-400">(선택 없음)</span>
                        )}
                      </div>
                    </div>

                    {/* 활동 3: 올바른 태도 답변 요약 */}
                    <div className="mb-3">
                      <span className="text-xs font-bold text-slate-600 block mb-1">
                        🛡️ 정보 대처 태도:
                      </span>
                      <p className="text-xs text-slate-700 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-200/60 leading-relaxed line-clamp-2">
                        {member.activity3.q2Attitude || '(미작성)'}
                      </p>
                    </div>

                    {/* 교사 피드백이 있는 경우 */}
                    {member.teacherFeedback && (
                      <div className="mb-3 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200 text-xs text-indigo-900">
                        <span className="font-bold">👨‍🏫 선생님 피드백: </span>
                        <span>{member.teacherFeedback}</span>
                      </div>
                    )}
                  </div>

                  {/* 카드 하단 액션 버튼 */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      단서 8개 기록 완료
                    </span>
                    <button
                      onClick={() => setSelectedNotebookDetail(member)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>수첩 전체 내용 열람</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 모둠원 답변 한눈에 비교 표 */
            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-indigo-50/80 border-b-2 border-indigo-200 text-indigo-950 font-black">
                    <th className="p-3.5 min-w-[100px]">탐정 이름</th>
                    <th className="p-3.5 min-w-[110px]">소문 신뢰도</th>
                    <th className="p-3.5 min-w-[200px]">판단 이유</th>
                    <th className="p-3.5 min-w-[140px]">핵심 단서</th>
                    <th className="p-3.5 min-w-[180px]">소문 전달 시 문제점</th>
                    <th className="p-3.5 min-w-[180px]">올바른 태도</th>
                    <th className="p-3.5 min-w-[80px] text-center">전체 보기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {groupMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-black text-slate-900 flex items-center gap-1.5">
                        <span>👤</span>
                        <span>{m.studentName}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                            m.activity2.rumorTrustLevel === '믿기 어렵다.'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.activity2.rumorTrustLevel === '더 확인해야 한다.'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.activity2.rumorTrustLevel || '미선택'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 leading-relaxed max-w-xs">
                        <p className="line-clamp-2">{m.activity2.reason || '-'}</p>
                      </td>
                      <td className="p-3.5 text-slate-700">
                        <div className="flex flex-wrap gap-1">
                          {m.activity2.importantClueIds?.map((id) => (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-bold"
                            >
                              단서 {id}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 leading-relaxed max-w-xs">
                        <p className="line-clamp-2">{m.activity3.q1SpreadProblem || '-'}</p>
                      </td>
                      <td className="p-3.5 text-slate-700 leading-relaxed max-w-xs">
                        <p className="line-clamp-2">{m.activity3.q2Attitude || '-'}</p>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setSelectedNotebookDetail(m)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition border border-indigo-200"
                        >
                          열람
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 우리 조 토론 & 한마디 나누기 */}
      {activeTab === 'discussion' && (
        <div className="space-y-6">
          {/* 댓글/의견 작성 폼 */}
          <div className="bg-white rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-sm">
            <h3 className="font-black text-base text-slate-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span>{activeGroup}조 친구들과 생각과 피드백을 나눠보세요</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              모둠원의 수첩을 읽고 인상 깊었던 근거, 함께 짚어볼 점, 새롭게 깨달은 사실을 자유롭게 작성해 보세요.
            </p>

            <form onSubmit={handlePostComment} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    작성자 이름 <span className="text-indigo-600 font-semibold">(본인 이름 입력)</span>:
                  </label>
                  <input
                    type="text"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    placeholder="본인 이름을 적어주세요"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">관련 단서 (선택):</label>
                  <select
                    value={commentClueRef}
                    onChange={(e) => setCommentClueRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none bg-white"
                  >
                    <option value="">단서 지정 안 함 (전체 종합)</option>
                    {CLUES.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  모둠 친구들에게 전할 의견 / 칭찬 / 생각:
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="모둠 친구들에게 전할 생각이나 의견을 적어보세요."
                  rows={3}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none transition leading-relaxed bg-amber-50/20"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-black text-xs sm:text-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>의견 남기기</span>
                </button>
              </div>
            </form>
          </div>

          {/* 등록된 조별 토론 목록 */}
          <div className="space-y-3">
            <h4 className="font-black text-sm text-slate-700 flex items-center justify-between">
              <span>💬 {activeGroup}조 나눔 목록 ({activeGroupComments.length}개)</span>
            </h4>

            {activeGroupComments.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
                아직 {activeGroup}조에 작성된 의견이 없습니다. 첫 번째 의견을 남겨 모둠 토론을 시작해 보세요!
              </div>
            ) : (
              activeGroupComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-xs flex items-start justify-between gap-3 hover:border-amber-300 transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900">
                        👤 {comment.author}
                      </span>
                      {comment.clueReference && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                          {comment.clueReference}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">{comment.createdAt}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>

                  <button
                    onClick={() => onLikeComment(comment.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 transition text-xs font-bold cursor-pointer shrink-0"
                    title="공감해요"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>{comment.likes || 0}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 탭 3: 우리 조 종합 결론 & 발표 준비 */}
      {activeTab === 'conclusion' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 sm:border-4 border-amber-300 p-6 sm:p-8 shadow-xl">
            {/* 결론지 헤더 */}
            <div className="border-b-4 border-amber-500 pb-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-block mb-1">
                  모둠 협력 보고서
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  📋 {activeGroup}조 종합 합의 결론 & 발표 시트
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  개별 탐정 수첩을 바탕으로 모둠 친구들이 함께 토론하여 도출한 최종 결론입니다.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">
                  최근 저장: {existingConclusion.updatedAt || '저장 이력 없음'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {/* 1. 우리 조의 소문 최종 합의 판단 */}
              <div>
                <label className="block text-sm sm:text-base font-black text-slate-900 mb-2">
                  1. 우리 조가 최종 합의한 "문화예술 발표회가 취소됐다"는 소문에 대한 신뢰도 판단:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: '믿기 어렵다.', color: 'emerald' },
                    { label: '더 확인해야 한다.', color: 'amber' },
                    { label: '믿을 만하다.', color: 'rose' },
                    { label: '의견 조율 중 (다수결/토론 중)', color: 'slate' }
                  ].map((item) => {
                    const isSelected = conclusionVerdict === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setConclusionVerdict(item.label)}
                        className={`p-3.5 rounded-xl font-black text-xs sm:text-sm border-2 transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 우리 조가 정한 가장 결정적인 근거 */}
              <div>
                <label className="block text-sm sm:text-base font-black text-slate-900 mb-2">
                  2. 우리 조가 정한 가장 결정적인 핵심 근거:
                </label>
                <textarea
                  value={conclusionReason}
                  onChange={(e) => setConclusionReason(e.target.value)}
                  placeholder="우리 조가 정한 가장 결정적인 핵심 근거를 적어보세요."
                  rows={4}
                  className="w-full p-4 text-xs sm:text-sm rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none transition leading-relaxed bg-amber-50/20"
                />
              </div>

              {/* 3. 우리 조가 꼽은 핵심 단서들 */}
              <div>
                <label className="block text-sm sm:text-base font-black text-slate-900 mb-2">
                  3. 우리 조가 가장 중요하게 꼽은 단서들 (복수 선택):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CLUES.map((clue) => {
                    const isChecked = conclusionClues.includes(clue.id);
                    return (
                      <label
                        key={clue.id}
                        onClick={() => {
                          setConclusionClues((prev) =>
                            prev.includes(clue.id)
                              ? prev.filter((id) => id !== clue.id)
                              : [...prev, clue.id]
                          );
                        }}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition ${
                          isChecked
                            ? 'bg-amber-50 border-amber-500 text-amber-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-amber-600 rounded border-slate-300"
                        />
                        <span>{clue.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 4. 학급 전체 공유 시 우리 조 발표 멘트 */}
              <div>
                <label className="block text-sm sm:text-base font-black text-slate-900 mb-2">
                  4. 학급 전체 공유 발표 멘트 준비:
                </label>

                {/* 말하는 대본 양식 안내 박스 */}
                <div className="mb-3 p-4 bg-emerald-50/80 rounded-2xl border-2 border-emerald-300 text-slate-900 text-xs sm:text-sm leading-relaxed shadow-xs">
                  <div className="flex items-center gap-1.5 font-black text-emerald-800 text-sm mb-2">
                    <span>📢 발표 대본 양식 (아래 양식에 맞춰 발표 내용을 정리해 보세요)</span>
                  </div>
                  <div className="bg-white/95 p-3.5 rounded-xl border border-emerald-200 font-semibold text-slate-800 space-y-1.5 shadow-xs">
                    <p>
                      “안녕하세요, 저희 <span className="text-emerald-700 font-black underline decoration-emerald-400 decoration-2 underline-offset-2">[{activeGroup}조]</span>는 '문화예술 발표회가 취소됐다'는 소문이 <span className="text-emerald-700 font-black underline decoration-emerald-400 decoration-2 underline-offset-2">[ &nbsp; &nbsp; &nbsp; &nbsp; ]</span>하다는 판단을 내렸습니다.
                    </p>
                    <p>
                      이유는 <span className="text-emerald-700 font-black underline decoration-emerald-400 decoration-2 underline-offset-2">[ &nbsp; &nbsp; &nbsp; &nbsp; ]</span>이기 때문입니다.
                    </p>
                    <p>
                      앞으로 매체를 접할 때 <span className="text-emerald-700 font-black underline decoration-emerald-400 decoration-2 underline-offset-2">[ &nbsp; &nbsp; &nbsp; &nbsp; ]</span> 태도/방법을 실천하겠습니다.”
                    </p>
                  </div>
                </div>

                <textarea
                  value={conclusionPresentation}
                  onChange={(e) => setConclusionPresentation(e.target.value)}
                  placeholder={`안녕하세요, 저희 ${activeGroup}조는 '문화예술 발표회가 취소됐다'는 소문이 [      ]하다는 판단을 내렸습니다. 이유는 [      ]이기 때문입니다. 앞으로 매체를 접할 때 [      ] 태도/방법을 사용하겠습니다.`}
                  rows={4}
                  className="w-full p-4 text-xs sm:text-sm rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none transition leading-relaxed bg-emerald-50/20"
                />
              </div>

              {/* 저장 및 인쇄 버튼 바 */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrintGroupSheet}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border-2 border-slate-300 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>이 발표 시트 인쇄하기</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveGroupConclusion}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{activeGroup}조 종합 결론 저장하기</span>
                </button>
              </div>

              {/* 종합 결론 저장 알림 (버튼 바로 밑에 표시) */}
              {saveSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-sm font-bold flex items-center justify-between gap-3 animate-bounce shadow-md">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSaveSuccessMsg(null)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 수첩 상세 열람 모달 */}
      {selectedNotebookDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border-4 border-amber-300">
            <button
              onClick={() => setSelectedNotebookDetail(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 모달 상단 헤더 */}
            <div className="border-b-4 border-amber-500 pb-4 mb-6">
              <span className="text-xs font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block mb-1">
                {activeGroup}조 모둠원 수첩 열람
              </span>
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>🕵️ {selectedNotebookDetail.studentName} 탐정의 전체 수첩</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                제출 일시: {selectedNotebookDetail.submittedAt} / 판단: {selectedNotebookDetail.activity2.rumorTrustLevel}
              </p>
            </div>

            {/* 단서 1~8 기록 */}
            <div className="space-y-6 text-xs sm:text-sm">
              <div>
                <h4 className="font-black text-slate-900 pb-1 border-b border-slate-200 mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-xs flex items-center justify-center font-black">
                    1
                  </span>
                  <span>단서 1~8 탐색 및 신뢰도 기록</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CLUES.map((clue) => {
                    const res = selectedNotebookDetail.clueResponses[clue.id];
                    return (
                      <div
                        key={clue.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900">{clue.title}</span>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-950 rounded border border-amber-300">
                            1. 신뢰도: {res?.trustLevel || '미선택'}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold text-slate-600 block mb-0.5">2. 생각한 까닭:</span>
                          <p className="text-slate-800 bg-white p-2 rounded border border-slate-200 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                            {res?.reason || '(까닭 미작성)'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 활동 2 */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 space-y-2">
                <h4 className="font-black text-indigo-950 flex items-center gap-1.5 text-sm">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-xs flex items-center justify-center font-black">
                    2
                  </span>
                  <span>활동 2: 신뢰성 판단 및 근거</span>
                </h4>
                <div className="text-xs text-slate-800 space-y-1.5">
                  <p>
                    <strong>소문 판단:</strong> {selectedNotebookDetail.activity2.rumorTrustLevel}
                  </p>
                  <p>
                    <strong>판단 근거:</strong> {selectedNotebookDetail.activity2.reason}
                  </p>
                </div>
              </div>

              {/* 활동 3 */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="font-black text-emerald-950 flex items-center gap-1.5 text-sm">
                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-xs flex items-center justify-center font-black">
                    3
                  </span>
                  <span>활동 3: 최종 추리 및 올바른 태도</span>
                </h4>
                <div className="text-xs text-slate-800 space-y-1.5">
                  <p>
                    <strong>취소 소문 전달 시 문제점:</strong> {selectedNotebookDetail.activity3.q1SpreadProblem}
                  </p>
                  <p>
                    <strong>놀랍거나 급한 정보를 보았을 때 올바른 태도:</strong> {selectedNotebookDetail.activity3.q2Attitude}
                  </p>
                </div>
              </div>

              {selectedNotebookDetail.teacherFeedback && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-300 text-xs">
                  <strong className="text-amber-950">선생님 피드백:</strong> {selectedNotebookDetail.teacherFeedback}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedNotebookDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CLUES } from './data/clues';
import { ClueRenderer } from './components/ClueRenderer';
import { NotebookView } from './components/NotebookView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { GroupShareView } from './components/GroupShareView';
import { SideCompanionHUD } from './components/SideCompanionHUD';
import {
  StudentClueResponse,
  Activity2Response,
  Activity3Response,
  Step,
  SubmittedNotebook,
  ClassTimerState,
  GroupComment,
  GroupConclusion,
  StudentRealtimeProgress
} from './types';
import {
  Search,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Award,
  Sparkles,
  RotateCcw,
  Printer,
  ChevronRight,
  Info,
  ShieldCheck,
  Calendar,
  Eye,
  Edit2,
  Users,
  GraduationCap,
  Lock,
  Clock,
  Play,
  Square,
  Minus,
  Folder,
  Share2
} from 'lucide-react';

const STORAGE_KEY = 'fact_detective_data_v2';
const SUBMISSIONS_KEY = 'fact_detective_submissions_v6';
const TIMER_STORAGE_KEY = 'fact_detective_timer_v3';
const GROUP_COMMENTS_KEY = 'fact_detective_group_comments_v4';
const GROUP_CONCLUSIONS_KEY = 'fact_detective_group_conclusions_v3';

// 초기 제출 데이터 (공유방 및 대시보드 깨끗하게 빈 상태로 시작)
const INITIAL_DEMO_SUBMISSIONS: SubmittedNotebook[] = [];
const INITIAL_GROUP_COMMENTS: GroupComment[] = [];
const INITIAL_GROUP_CONCLUSIONS: Record<number, GroupConclusion> = {};

export default function App() {
  const [step, setStep] = useState<Step>('intro');
  const [currentClueIdx, setCurrentClueIdx] = useState<number>(0); // 0 ~ 7 (단서 1~8)
  const [studentName, setStudentName] = useState<string>('');
  const [studentGroup, setStudentGroup] = useState<number>(1); // 1~5조 (기본 1조)

  // 구간별 진행 제어 상태 (교사 제어 및 학생 대기 상태)
  const [stage2Unlocked, setStage2Unlocked] = useState<boolean>(false);
  const [isWaitingForStage2, setIsWaitingForStage2] = useState<boolean>(false);
  const [realtimeStudents, setRealtimeStudents] = useState<Record<string, StudentRealtimeProgress>>({});

  // 단서 1~8 학생 응답 (1번 질문: 신뢰도 선택, 2번 질문: 까닭 작성)
  const [clueResponses, setClueResponses] = useState<Record<number, StudentClueResponse>>({
    1: { trustLevel: '', reason: '' },
    2: { trustLevel: '', reason: '' },
    3: { trustLevel: '', reason: '' },
    4: { trustLevel: '', reason: '' },
    5: { trustLevel: '', reason: '' },
    6: { trustLevel: '', reason: '' },
    7: { trustLevel: '', reason: '' },
    8: { trustLevel: '', reason: '' }
  });

  // 활동 2 응답
  const [activity2, setActivity2] = useState<Activity2Response>({
    rumorTrustLevel: '',
    reason: '',
    importantClueIds: []
  });

  // 활동 3 응답
  const [activity3, setActivity3] = useState<Activity3Response>({
    q1SpreadProblem: '',
    q2Attitude: ''
  });

  // 교사용 제출된 수첩 목록
  const [submittedNotebooks, setSubmittedNotebooks] = useState<SubmittedNotebook[]>(INITIAL_DEMO_SUBMISSIONS);

  // 1~5조 토론 댓글 및 모둠 종합 결론 상태
  const [groupComments, setGroupComments] = useState<GroupComment[]>(INITIAL_GROUP_COMMENTS);
  const [groupConclusions, setGroupConclusions] = useState<Record<number, GroupConclusion>>(INITIAL_GROUP_CONCLUSIONS);

  // 25분 수업 타이머 상태
  const [classTimer, setClassTimer] = useState<ClassTimerState>({
    isRunning: false,
    startTime: null,
    durationMinutes: 25,
    endTime: null,
    isExpired: false
  });
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(25);

  // 교사 비밀번호 (기본값: 0224)
  const [teacherPin, setTeacherPin] = useState<string>('0224');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingTeacherAction, setPendingTeacherAction] = useState<(() => void) | null>(null);
  const [authModalConfig, setAuthModalConfig] = useState<{
    title: string;
    description: string;
    confirmButtonText: string;
  }>({
    title: '교사용 전용 권한 인증',
    description: '선생님 전용 인증을 거쳐야 수첩 열람 및 타이머 제어가 가능합니다.',
    confirmButtonText: '인증하고 계속하기'
  });

  // 교사 인증이 필요한 액션 실행기
  const requireTeacherAuth = (
    action: () => void,
    title = '교사용 권한 인증',
    description = '타이머 시간 설정, 시작, 일시정지, 초기화는 선생님만 진행할 수 있습니다.',
    confirmButtonText = '인증 완료하기'
  ) => {
    if (isTeacherAuthenticated) {
      action();
    } else {
      setPendingTeacherAction(() => action);
      setAuthModalConfig({
        title,
        description,
        confirmButtonText
      });
      setIsAuthModalOpen(true);
    }
  };

  // 유효성 경고 알림 상태
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // 시간 포맷팅 헬퍼
  const formatTime = (totalSec: number) => {
    if (totalSec <= 0) return '00:00';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 로컬 스토리지 데이터 복원
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem('fact_detective_teacher_pin');
      if (savedPin && savedPin !== '1030') {
        setTeacherPin(savedPin);
      } else {
        setTeacherPin('0224');
        localStorage.setItem('fact_detective_teacher_pin', '0224');
      }

      // 이전 버전 타이머 정리
      localStorage.removeItem('fact_detective_timer_v2');

      // 타이머 복원
      const savedTimer = localStorage.getItem(TIMER_STORAGE_KEY);
      if (savedTimer) {
        const parsedTimer: ClassTimerState = JSON.parse(savedTimer);
        if (parsedTimer.isExpired) {
          // 만료된 경우 초기화
          localStorage.removeItem(TIMER_STORAGE_KEY);
        } else {
          setClassTimer(parsedTimer);
          const duration = parsedTimer.durationMinutes || 25;
          setCustomMinutesInput(duration);
          if (parsedTimer.endTime && parsedTimer.isRunning) {
            const diff = Math.max(0, Math.floor((parsedTimer.endTime - Date.now()) / 1000));
            setRemainingSeconds(diff);
            if (diff <= 0) {
              handleExpireAndAutoSubmit();
            }
          } else {
            setRemainingSeconds(duration * 60);
          }
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.clueResponses) setClueResponses(parsed.clueResponses);
        if (parsed.activity2) setActivity2(parsed.activity2);
        if (parsed.activity3) setActivity3(parsed.activity3);
        if (parsed.studentName) setStudentName(parsed.studentName);
        if (parsed.studentGroup) setStudentGroup(parsed.studentGroup);
        if (parsed.step && parsed.step !== 'teacher') setStep(parsed.step);
        if (typeof parsed.currentClueIdx === 'number') setCurrentClueIdx(parsed.currentClueIdx);
      }

      // 이전 버전 더미/데모 및 기존 제출 학생 데이터 완전 삭제
      localStorage.removeItem('fact_detective_data_v1');
      localStorage.removeItem('fact_detective_submissions_v1');
      localStorage.removeItem('fact_detective_submissions_v2');
      localStorage.removeItem('fact_detective_submissions_v3');
      localStorage.removeItem('fact_detective_submissions_v4');
      localStorage.removeItem('fact_detective_submissions_v5');
      localStorage.removeItem('fact_detective_group_comments_v1');
      localStorage.removeItem('fact_detective_group_comments_v2');
      localStorage.removeItem('fact_detective_group_comments_v3');
      localStorage.removeItem('fact_detective_group_conclusions_v1');
      localStorage.removeItem('fact_detective_group_conclusions_v2');

      const savedSubmissions = localStorage.getItem(SUBMISSIONS_KEY);
      if (savedSubmissions) {
        const parsedSub = JSON.parse(savedSubmissions);
        if (Array.isArray(parsedSub)) {
          // 데모 학생 데이터 배제
          const realSubs = parsedSub.filter((n: SubmittedNotebook) => n.id && !n.id.startsWith('sub-demo-') && !n.id.startsWith('sub-sample-'));
          setSubmittedNotebooks(realSubs);
          localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(realSubs));
        } else {
          setSubmittedNotebooks([]);
        }
      } else {
        setSubmittedNotebooks([]);
      }

      const savedComments = localStorage.getItem(GROUP_COMMENTS_KEY);
      if (savedComments) {
        const parsedComms = JSON.parse(savedComments);
        if (Array.isArray(parsedComms)) {
          const realComms = parsedComms.filter((c: GroupComment) => c.id && !c.id.startsWith('gc-demo-'));
          setGroupComments(realComms);
          localStorage.setItem(GROUP_COMMENTS_KEY, JSON.stringify(realComms));
        } else {
          setGroupComments([]);
        }
      } else {
        setGroupComments([]);
      }

      const savedConclusions = localStorage.getItem(GROUP_CONCLUSIONS_KEY);
      if (savedConclusions) {
        const parsedConcls = JSON.parse(savedConclusions);
        if (parsedConcls && typeof parsedConcls === 'object') {
          setGroupConclusions(parsedConcls);
        }
      } else {
        setGroupConclusions({});
      }
    } catch (e) {
      console.error('Failed to load saved detective progress', e);
    }
  }, []);

  // 1초 단위 타이머 인터벌
  useEffect(() => {
    if (!classTimer.isRunning || !classTimer.endTime) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((classTimer.endTime! - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(interval);
        handleExpireAndAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [classTimer.isRunning, classTimer.endTime, clueResponses, activity2, activity3, studentName]);

  // 상태 변경 시 자동 저장
  useEffect(() => {
    try {
      const payload = {
        clueResponses,
        activity2,
        activity3,
        studentName,
        studentGroup,
        step: step === 'teacher' ? 'completed' : step,
        currentClueIdx
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save detective progress', e);
    }
  }, [clueResponses, activity2, activity3, studentName, studentGroup, step, currentClueIdx]);

  // 제출 목록 변경 시 저장
  useEffect(() => {
    try {
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submittedNotebooks));
    } catch (e) {
      console.error('Failed to save submissions', e);
    }
  }, [submittedNotebooks]);

  // 조별 토론 및 종합 결론 변경 시 저장
  useEffect(() => {
    try {
      localStorage.setItem(GROUP_COMMENTS_KEY, JSON.stringify(groupComments));
    } catch (e) {
      console.error('Failed to save group comments', e);
    }
  }, [groupComments]);

  useEffect(() => {
    try {
      localStorage.setItem(GROUP_CONCLUSIONS_KEY, JSON.stringify(groupConclusions));
    } catch (e) {
      console.error('Failed to save group conclusions', e);
    }
  }, [groupConclusions]);

  // 실시간 기기 간 동기화 폴링 (1.5초 주기)
  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        // 2단계 잠금 상태 동기화
        if (typeof data.stage2Unlocked === 'boolean') {
          setStage2Unlocked((prev) => {
            // 학생이 1단계를 마치고 대기 중인데 교사가 2단계를 해제한 경우
            if (!prev && data.stage2Unlocked) {
              setIsWaitingForStage2((waiting) => {
                if (waiting) {
                  setCurrentClueIdx(4); // 5번 단서(인덱스 4)로 즉시 자동 이동
                  setWarningMsg('🎉 선생님이 2단계(단서 5~8) 활동을 시작하셨습니다! 5번 단서부터 조사를 계속해 보세요.');
                  return false;
                }
                return waiting;
              });
            }
            return data.stage2Unlocked;
          });
        }

        // 전체 학생 실시간 진행 상황 동기화
        if (data.students && typeof data.students === 'object') {
          setRealtimeStudents(data.students);
        }

        // 제출된 수첩 목록 동기화
        if (Array.isArray(data.submissions)) {
          setSubmittedNotebooks(data.submissions);
        }

        // 조별 댓글 및 종합 결론 동기화
        if (Array.isArray(data.groupComments)) {
          setGroupComments(data.groupComments);
        }
        if (data.groupConclusions && typeof data.groupConclusions === 'object') {
          setGroupConclusions(data.groupConclusions);
        }

        // 교사가 아닌 학생 기기의 경우 교사용 타이머 동기화
        if (data.classTimer && !isTeacherAuthenticated) {
          setClassTimer(data.classTimer);
          if (data.classTimer.endTime && data.classTimer.isRunning) {
            const diff = Math.max(0, Math.floor((data.classTimer.endTime - Date.now()) / 1000));
            setRemainingSeconds(diff);
            if (diff <= 0) {
              handleExpireAndAutoSubmit();
            }
          }
        }
      } catch (e) {
        // 네트워크 일시 오류 시 조용히 무시 (로컬 스토리지 유지)
      }
    };

    syncSession();
    const interval = setInterval(syncSession, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isTeacherAuthenticated]);

  // 학생 진행 상황 서버 실시간 보고 (작성 시 350ms 디바운스 전송)
  useEffect(() => {
    if (!studentName || !studentName.trim()) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/student-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: studentName.trim(),
            studentGroup,
            clueResponses,
            activity2,
            activity3,
            step,
            currentClueIdx,
            isSubmitted: step === 'completed'
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.stage2Unlocked === 'boolean') {
            setStage2Unlocked((prev) => {
              if (!prev && data.stage2Unlocked && isWaitingForStage2) {
                setIsWaitingForStage2(false);
                setCurrentClueIdx(4);
              }
              return data.stage2Unlocked;
            });
          }
        }
      } catch (e) {
        // 로컬 보존
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [studentName, studentGroup, clueResponses, activity2, activity3, step, currentClueIdx, isWaitingForStage2]);

  // 교사용 2단계(단서 5~8) 잠금 해제 / 잠금 토글 핸들러
  const handleToggleStage2Lock = async (unlocked: boolean) => {
    setStage2Unlocked(unlocked);
    try {
      await fetch('/api/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage2Unlocked: unlocked })
      });
    } catch (e) {
      console.error('Failed to toggle stage lock', e);
    }
  };

  // 단서별 응답 업데이트 헬퍼
  const handleUpdateClue = (
    field: keyof StudentClueResponse,
    value: string
  ) => {
    const clueId = currentClueIdx + 1;
    setClueResponses((prev) => ({
      ...prev,
      [clueId]: {
        ...(prev[clueId] || { features: '', trustLevel: '', reason: '' }),
        [field]: value
      }
    }));
    setWarningMsg(null);
  };

  // 다음 단서로 이동 처리
  const handleNextClue = () => {
    const clueId = currentClueIdx + 1;
    const current = clueResponses[clueId];

    // 1번 질문: 이 단서를 얼마나 믿을 수 있다고 생각하나요? (필수 선택)
    if (!current?.trustLevel || current.trustLevel.trim().length === 0) {
      setWarningMsg('1번 문항: 이 단서를 얼마나 믿을 수 있는지 신뢰도를 선택해 주세요! (필수 선택)');
      return;
    }

    // 2번 질문: 그렇게 생각한 까닭은 무엇인가요? (필수 작성)
    if (!current?.reason || current.reason.trim().length === 0) {
      setWarningMsg('2번 문항: 그렇게 생각한 까닭을 작성해 주세요! (필수 작성)');
      return;
    }

    setWarningMsg(null);

    // 1단계(1~4번) 완료 후 2단계가 아직 잠겨 있는 경우 대기 화면으로 전환
    if (currentClueIdx === 3 && !stage2Unlocked) {
      setIsWaitingForStage2(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2단계 잠금 상태에서 5번 이후로 넘어가는 것 차단
    if (currentClueIdx >= 3 && !stage2Unlocked) {
      setIsWaitingForStage2(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentClueIdx < 7) {
      setCurrentClueIdx((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 8개 단서 탐색 완료 -> 활동 2로 이동
      setStep('activity2');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 이전 단서로 이동 처리
  const handlePrevClue = () => {
    setWarningMsg(null);
    if (isWaitingForStage2) {
      setIsWaitingForStage2(false);
      setCurrentClueIdx(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentClueIdx > 0) {
      setCurrentClueIdx((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setStep('intro');
    }
  };

  // 활동 2 제출 및 활동 3 이동
  const handleSubmitActivity2 = () => {
    if (!activity2.rumorTrustLevel) {
      setWarningMsg('질문 1의 선택지를 골라주세요!');
      return;
    }
    if (!activity2.reason || activity2.reason.trim().length === 0) {
      setWarningMsg('질문 2의 판단 이유를 적어주세요!');
      return;
    }
    setWarningMsg(null);
    setStep('activity3');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 조별 배정 핸들러 (교사 또는 학생)
  const handleAssignStudentToGroup = (notebookId: string, groupId: number | null) => {
    setSubmittedNotebooks((prev) =>
      prev.map((nb) =>
        nb.id === notebookId
          ? {
              ...nb,
              groupId,
              groupAssignedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            }
          : nb
      )
    );
  };

  // 1~5조 균등 자동 배정 핸들러 (교사 전용)
  const handleBatchAutoDistribute = () => {
    setSubmittedNotebooks((prev) => {
      let g = 1;
      return prev.map((nb) => {
        const updated = {
          ...nb,
          groupId: g,
          groupAssignedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        g = g >= 5 ? 1 : g + 1;
        return updated;
      });
    });
  };

  // 예시 학생 10명 생성
  const handleAddSampleStudents = () => {
    setSubmittedNotebooks(INITIAL_DEMO_SUBMISSIONS);
  };

  // 전체 학생 수첩 및 공유방 비우기 (초기화)
  const handleClearAllSubmissions = () => {
    setSubmittedNotebooks([]);
    setGroupComments([]);
    localStorage.removeItem(SUBMISSIONS_KEY);
    localStorage.removeItem(GROUP_COMMENTS_KEY);
    localStorage.removeItem('fact_detective_submissions_v1');
    localStorage.removeItem('fact_detective_submissions_v2');
    localStorage.removeItem('fact_detective_submissions_v3');
    localStorage.removeItem('fact_detective_submissions_v4');
    localStorage.removeItem('fact_detective_submissions_v5');
    fetch('/api/reset-session', { method: 'POST' }).catch(() => {});
    setWarningMsg('🗑️ 공유방 및 대시보드의 모든 학생 데이터가 완전히 비워졌습니다. (현재 0명)');
  };

  // 학생 자신이 조 등록/변경
  const handleAssignCurrentStudentGroup = (groupId: number) => {
    setStudentGroup(groupId);
    const currentName = studentName.trim() || '김유민';
    setSubmittedNotebooks((prev) => {
      const idx = prev.findIndex((n) => n.studentName === currentName);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], groupId };
        return updated;
      } else {
        const newSubmission: SubmittedNotebook = {
          id: 'sub-' + Date.now(),
          studentName: currentName,
          submittedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          clueResponses: { ...clueResponses },
          activity2: { ...activity2 },
          activity3: { ...activity3 },
          groupId
        };
        fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission: newSubmission })
        }).catch(() => {});
        return [newSubmission, ...prev];
      }
    });
  };

  // 조별 토론 의견 추가
  const handleAddGroupComment = (commentData: Omit<GroupComment, 'id' | 'createdAt' | 'likes'>) => {
    const newComment: GroupComment = {
      ...commentData,
      id: 'gc-' + Date.now(),
      createdAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      likes: 0
    };
    setGroupComments((prev) => [newComment, ...prev]);
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: newComment })
    }).catch(() => {});
  };

  // 조별 토론 공감
  const handleLikeGroupComment = (commentId: string) => {
    setGroupComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c))
    );
    fetch('/api/like-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId })
    }).catch(() => {});
  };

  // 조별 종합 결론 저장
  const handleSaveGroupConclusion = (conclusion: GroupConclusion) => {
    setGroupConclusions((prev) => ({
      ...prev,
      [conclusion.groupId]: conclusion
    }));
    fetch('/api/conclusions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conclusion })
    }).catch(() => {});
  };

  // 활동 3 제출 및 최종 완료 이동 + 교사용 제출 등록
  const handleSubmitActivity3 = () => {
    if (!activity3.q1SpreadProblem.trim() || !activity3.q2Attitude.trim()) {
      setWarningMsg('두 질문에 대한 답변을 모두 작성해 주세요!');
      return;
    }

    const currentName = studentName.trim() || '김유민';

    const newSubmission: SubmittedNotebook = {
      id: 'sub-' + Date.now(),
      studentName: currentName,
      submittedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      clueResponses: { ...clueResponses },
      activity2: { ...activity2 },
      activity3: { ...activity3 },
      groupId: studentGroup || 1
    };

    setSubmittedNotebooks((prev) => {
      const idx = prev.findIndex((n) => n.studentName === currentName);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...newSubmission, id: prev[idx].id };
        return updated;
      }
      return [newSubmission, ...prev];
    });

    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission: newSubmission })
    }).catch(() => {});

    setWarningMsg(null);
    setStep('completed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 시간 초과 시 자동 제출 처리
  const handleExpireAndAutoSubmit = () => {
    setClassTimer((prev) => {
      const updated = { ...prev, isRunning: false, isExpired: true };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    const currentName = studentName.trim() || '김유민';

    setSubmittedNotebooks((prev) => {
      const existing = prev.find((n) => n.studentName === currentName);
      const autoSubmission: SubmittedNotebook = {
        id: existing?.id || ('sub-' + Date.now()),
        studentName: currentName,
        submittedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        clueResponses: { ...clueResponses },
        activity2: { ...activity2 },
        activity3: { ...activity3 },
        isAutoSubmitted: true,
        groupId: studentGroup || existing?.groupId || 1
      };

      const idx = prev.findIndex((n) => n.studentName === currentName);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = autoSubmission;
        return updated;
      }
      return [autoSubmission, ...prev];
    });

    setStep('completed');
    setWarningMsg(`⏰ 활동 시간(${classTimer.durationMinutes || 25}분)이 종료되었습니다! 지금까지 작성한 탐정 수첩이 교사용 시스템으로 자동 제출되었습니다.`);
  };

  // 타이머 시작 (교사 전용)
  const handleStartTimer = (minutes?: number) => {
    const duration = minutes ?? customMinutesInput ?? classTimer.durationMinutes ?? 25;
    const now = Date.now();
    const end = now + duration * 60 * 1000;
    const newState: ClassTimerState = {
      isRunning: true,
      startTime: now,
      durationMinutes: duration,
      endTime: end,
      isExpired: false
    };
    setClassTimer(newState);
    setRemainingSeconds(duration * 60);
    setCustomMinutesInput(duration);
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(newState));
    fetch('/api/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classTimer: newState })
    }).catch(() => {});
    setWarningMsg(`⏱️ ${duration}분 수업 탐정 활동이 시작되었습니다! 학생들은 지금부터 작성할 수 있습니다.`);
  };

  // 타이머 일시정지 (교사 전용)
  const handleStopTimer = () => {
    setClassTimer((prev) => {
      const updated = { ...prev, isRunning: false };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(updated));
      fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classTimer: updated })
      }).catch(() => {});
      return updated;
    });
    setWarningMsg('⏸️ 수업 타이머가 일시정지되었습니다.');
  };

  // 타이머 초기화 / 재설정 (교사 전용)
  const handleResetTimer = (minutes?: number) => {
    const duration = minutes ?? customMinutesInput ?? classTimer.durationMinutes ?? 25;
    const newState: ClassTimerState = {
      isRunning: false,
      startTime: null,
      durationMinutes: duration,
      endTime: null,
      isExpired: false
    };
    setClassTimer(newState);
    setRemainingSeconds(duration * 60);
    setCustomMinutesInput(duration);
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(newState));
    fetch('/api/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classTimer: newState })
    }).catch(() => {});
    setWarningMsg(`⏱️ 활동 시간이 ${duration}분(시작 대기 상태)으로 재설정 및 초기화되었습니다.`);
  };

  // 타이머 시간 연장 / 단축 (교사 전용)
  const handleAddMinutes = (extraMinutes: number = 5) => {
    setClassTimer((prev) => {
      const currentDuration = prev.durationMinutes || 25;
      const newDuration = Math.max(1, currentDuration + extraMinutes);

      let updated: ClassTimerState;
      if (prev.isRunning && prev.endTime) {
        const newEnd = Math.max(Date.now() + 10000, prev.endTime + extraMinutes * 60 * 1000);
        updated = { ...prev, durationMinutes: newDuration, endTime: newEnd };
        const diff = Math.max(0, Math.floor((newEnd - Date.now()) / 1000));
        setRemainingSeconds(diff);
        setCustomMinutesInput(newDuration);
      } else {
        updated = { ...prev, durationMinutes: newDuration };
        setRemainingSeconds(newDuration * 60);
        setCustomMinutesInput(newDuration);
      }
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(updated));
      fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classTimer: updated })
      }).catch(() => {});
      return updated;
    });
    setWarningMsg(
      extraMinutes > 0
        ? `⏱️ 활동 시간이 +${extraMinutes}분 연장되었습니다.`
        : `⏱️ 활동 시간이 ${extraMinutes}분 단축되었습니다.`
    );
  };

  // 첫 화면에서 탐정 활동 시작하기 버튼 클릭 처리
  const handleStartActivity = () => {
    if (!studentName || studentName.trim().length === 0) {
      setWarningMsg('탐정 이름을 먼저 입력해 주세요! (필수 입력)');
      return;
    }

    if (classTimer.isExpired) {
      setWarningMsg(`활동 시간(${classTimer.durationMinutes || 25}분)이 종료되었습니다. 제출된 수첩만 열람 가능합니다.`);
      setStep('completed');
      return;
    }

    // 활동 시작 시 타이머가 아직 대기 상태라면 자동 시작
    if (!classTimer.isRunning) {
      handleStartTimer(classTimer.durationMinutes || 25);
    }

    if (studentName.trim()) {
      handleAssignCurrentStudentGroup(studentGroup);
    }

    setWarningMsg(null);
    setStep('clues');
    setCurrentClueIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 교사용 피드백 업데이트 핸들러
  const handleUpdateFeedback = (notebookId: string, feedback: string) => {
    setSubmittedNotebooks((prev) =>
      prev.map((nb) => (nb.id === notebookId ? { ...nb, teacherFeedback: feedback } : nb))
    );
  };

  // 교사 모드 열기 (비밀번호 확인)
  const handleOpenTeacherDashboard = () => {
    requireTeacherAuth(
      () => {
        setStep('teacher');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      '교사용 전용 수첩 잠금',
      '선생님 전용 인증을 거쳐야 학생들의 제출 수첩을 열람하고 피드백을 작성할 수 있습니다.',
      '인증하고 교사용 수첩 열기'
    );
  };

  // 교사 모드 잠그기 / 로그아웃
  const handleLockTeacherMode = () => {
    setIsTeacherAuthenticated(false);
    setStep('completed');
  };

  // 비밀번호 변경
  const handleChangePin = (newPin: string) => {
    setTeacherPin(newPin);
    localStorage.setItem('fact_detective_teacher_pin', newPin);
  };

  // 전체 초기화
  const handleReset = () => {
    if (window.confirm('작성한 모든 기록을 처음 상태로 되돌릴까요?')) {
      localStorage.removeItem(STORAGE_KEY);
      setClueResponses({
        1: { trustLevel: '', reason: '' },
        2: { trustLevel: '', reason: '' },
        3: { trustLevel: '', reason: '' },
        4: { trustLevel: '', reason: '' },
        5: { trustLevel: '', reason: '' },
        6: { trustLevel: '', reason: '' },
        7: { trustLevel: '', reason: '' },
        8: { trustLevel: '', reason: '' }
      });
      setActivity2({
        rumorTrustLevel: '',
        reason: '',
        importantClueIds: []
      });
      setActivity3({
        q1SpreadProblem: '',
        q2Attitude: ''
      });
      setStudentName('');
      setCurrentClueIdx(0);
      setStep('intro');
      setWarningMsg(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-900 font-sans selection:bg-amber-300 selection:text-amber-950 flex flex-col">
      {/* 상단 네비게이션 헤더 */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/80 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setStep('intro')}
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                  팩트 탐정단
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  사라진 효성벼리 문화예술발표회
                </span>
              </div>
              <p className="text-xs text-slate-500">효성초등학교 5~6학년 정보 신뢰성 탐정 활동</p>
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* 교사용 대시보드 버튼 (비밀번호 잠금 보호) */}
            <button
              onClick={() => {
                if (step === 'teacher') {
                  setStep('completed');
                } else {
                  handleOpenTeacherDashboard();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${
                step === 'teacher'
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                  : 'bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-indigo-100'
              }`}
            >
              {step === 'teacher' ? (
                <>
                  <GraduationCap className="w-4 h-4 text-indigo-200" />
                  <span>학생 화면 복귀</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>🔒 교사용 수첩</span>
                </>
              )}
            </button>

            {/* 1~5조 결과 공유방 버튼 */}
            {step !== 'teacher' && (
              <button
                onClick={() => {
                  setStep('group-share');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer ${
                  step === 'group-share'
                    ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                    : 'bg-amber-100/80 text-amber-950 border border-amber-300 hover:bg-amber-200'
                }`}
              >
                <Users className="w-4 h-4 text-amber-800" />
                <span>👥 1~5조 공유방</span>
              </button>
            )}

            {step !== 'intro' && step !== 'teacher' && (
              <button
                onClick={() => setStep('notebook')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition shadow-xs"
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">나의</span> 탐정 수첩
              </button>
            )}

            <button
              onClick={handleReset}
              title="처음부터 다시하기"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 단서 탐색 중 진행 바 */}
        {step === 'clues' && (
          <div className="max-w-5xl mx-auto mt-2 pt-2 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                단서 {currentClueIdx + 1} / 8
              </span>
              <span className="text-slate-500 font-medium hidden sm:inline">
                {CLUES[currentClueIdx].title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 sm:w-48 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentClueIdx + 1) / 8) * 100}%` }}
                />
              </div>
              <span>{Math.round(((currentClueIdx + 1) / 8) * 100)}%</span>
            </div>
          </div>
        )}
      </header>

      {/* 본문 컨테이너 */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-center">
        {/* STEP 1: 첫 화면 (Intro) - 탐정 활동 시작하기 버튼 칸까지만 노출 */}
        {step === 'intro' && (
          <div className="bg-white rounded-3xl border-2 sm:border-4 border-amber-200 p-6 sm:p-10 shadow-xl max-w-3xl mx-auto my-auto w-full">
            {/* 가상 시나리오 배지 */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 mb-4">
              <Info className="w-3.5 h-3.5 text-amber-700" />
              수업용 가상 시나리오 (실제 학교 공지가 아닙니다)
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">
                🕵️
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  팩트 탐정단: 사라진 효성벼리 문화예술발표회
                </h1>
                <p className="text-sm font-semibold text-amber-800 mt-0.5">
                  초등학교 5~6학년 정보 신뢰성 판별 인터랙티브 수업
                </p>
              </div>
            </div>

            {/* 메인 문구 */}
            <div className="bg-amber-50/80 rounded-2xl p-5 sm:p-6 border-2 border-amber-200/90 my-6">
              <p className="text-lg sm:text-xl font-extrabold text-amber-950 leading-relaxed text-center">
                “효성초등학교 효성벼리 문화예술발표회가 취소됐다는 소문이 퍼졌어!<br className="hidden sm:block" />
                과연 진짜일까? 8개의 단서를 모아 진실을 밝혀 보자.”
              </p>
            </div>

            {/* 사건의 배경 */}
            <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4 text-indigo-600" />
                사건의 배경
              </h3>
              <p>
                효성초등학교 효성벼리 문화예술발표회가 <strong>2026년 10월 30일 금요일 오전 9시 50분</strong>에 강당에서 열릴 예정이야. 
                그런데 어느 날 학생들 사이에 <em>“효성벼리 문화예술발표회가 취소됐대!”</em>라는 소문이 퍼졌어.
              </p>
              <p>
                단순히 소문만 믿고 준비를 멈춰야 할까? 아니면 진짜 취소된 것일까?
                서로 다른 <strong>8개의 단서 자료</strong>를 하나씩 조사해 소문의 신뢰성을 스스로 판단해 보자!
              </p>
            </div>

            {/* 탐정 이름 입력란 */}
            <div className="mb-4 flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border-2 border-amber-200">
              <label className="text-sm font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
                <span>탐정 이름</span>
                <span className="text-red-500 font-black text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-200">* 필수 입력</span>:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  setWarningMsg(null);
                }}
                placeholder="예: 김유민"
                className="w-full px-4 py-2 text-sm font-semibold rounded-xl border-2 border-amber-300 focus:outline-none focus:border-indigo-500 bg-amber-50/30"
              />
            </div>

            {/* 탐정 모둠(조) 선택란 (1~5조) */}
            <div className="mb-6 bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>소속 모둠(조) 선택</span>
                  <span className="text-red-500 font-black text-xs bg-red-50 px-1.5 py-0.5 rounded border border-red-200">* 필수 선택</span>:
                </label>
                <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 self-start sm:self-auto">
                  선택됨: <strong>{studentGroup}조</strong> (최종 공유방 연동)
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((g) => {
                  const isSelected = studentGroup === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setStudentGroup(g);
                        setWarningMsg(null);
                        if (studentName.trim()) {
                          handleAssignCurrentStudentGroup(g);
                        }
                      }}
                      className={`py-3 px-2 rounded-xl font-black text-sm sm:text-base border-2 transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300 scale-[1.02]'
                          : 'bg-slate-50 hover:bg-amber-50/70 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="text-[11px] font-semibold opacity-80">모둠</span>
                      <span>{g}조</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                👉 선택한 조는 탐정 활동 후 <strong>{studentGroup}조 모둠 결과 공유방</strong>으로 자동 연결되어 모둠 친구들과 함께 수첩을 나누게 됩니다.
              </p>
            </div>

            {/* 화면 바로 앞 필수 입력 안내 */}
            {warningMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-sm font-bold flex items-start gap-2.5 animate-bounce shadow-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-black text-rose-700 block uppercase">⚠️ 시작 전 필수 항목 확인</span>
                  <span>{warningMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWarningMsg(null)}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 rounded-lg hover:bg-rose-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 시작하기 버튼 바 (여기까지만 표시) */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleStartActivity}
                className="flex-1 py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-black text-lg sm:text-xl shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>탐정 활동 시작하기</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>

              <button
                onClick={handleOpenTeacherDashboard}
                className="px-5 py-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-2 border-indigo-300 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>🔒 교사용 수첩 모아보기</span>
              </button>
            </div>
          </div>
        )}

        {/* 학생 활성 작업 단계: 단서 8개, 활동 2, 활동 3 (화면 옆 실시간 타이머 및 경고 HUD 제공) */}
        {(step === 'clues' || step === 'activity2' || step === 'activity3') && (
          <div className="w-full max-w-6xl mx-auto flex flex-col xl:flex-row gap-6 items-start justify-center">
            {/* 좌측: 활성 작업 카드 */}
            <div className="flex-1 w-full min-w-0">

        {/* STEP 2: 단서 8개 탐색 화면 */}
        {step === 'clues' && (
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            {/* 단서 번호 & 제목 헤더 */}
            <div className="bg-amber-100/70 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
                    단서 {currentClueIdx + 1} / 8
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    {CLUES[currentClueIdx].typeBadge}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {CLUES[currentClueIdx].title}
                </h2>
              </div>

              {/* 단서 탭 빠른 이동 (이전/다음) */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 8 }).map((_, i) => {
                  const isLocked = i >= 4 && !stage2Unlocked;
                  const isAnswered = Boolean(
                    clueResponses[i + 1]?.trustLevel && clueResponses[i + 1]?.reason?.trim()
                  );
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          setWarningMsg('🔒 2단계(단서 5~8번)는 선생님께서 1단계 활동 완료 후 열어주시면 시작할 수 있습니다.');
                          return;
                        }
                        if (isWaitingForStage2) {
                          setIsWaitingForStage2(false);
                        }
                        setCurrentClueIdx(i);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title={isLocked ? `단서 ${i + 1} (선생님 잠금 상태 - 2단계)` : `단서 ${i + 1}로 이동`}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isLocked
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75'
                          : currentClueIdx === i && !isWaitingForStage2
                          ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isLocked ? '🔒' : i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {isWaitingForStage2 && !stage2Unlocked ? (
              /* 1단계 완료 후 2단계 해제 대기 화면 */
              <div className="bg-white rounded-3xl border-2 sm:border-4 border-amber-400 p-6 sm:p-10 shadow-xl text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner relative">
                  <Lock className="w-10 h-10 text-amber-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                    🚦 구간별 속도 조절: 1단계 완료
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    1단계(단서 1~4번) 조사를 모두 마쳤습니다!
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
                    선생님께서 전체 학생들의 1단계 진행 상황을 실시간으로 확인하고 계십니다.<br />
                    모든 친구들이 1단계를 완료하면 선생님께서 <strong>'5~8번 활동 시작'</strong>을 열어주십니다. 잠시 기다려 주세요!
                  </p>
                </div>

                <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 text-left max-w-md mx-auto space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>선생님의 신호 대기 중 (실시간 동기화)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    선생님이 교사용 수첩에서 2단계를 활성화하면, <strong>새로고침을 누르지 않아도 자동으로 5번 단서 화면으로 넘어갑니다.</strong>
                  </p>
                  <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-800 font-bold">
                    <span>나의 1단계 탐색 상태:</span>
                    <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-black border border-emerald-300">
                      ✓ 단서 1~4번 기록 완료
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWaitingForStage2(false);
                      setCurrentClueIdx(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>작성한 1~4번 단서 다시 검토하기</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 1. 해당 자료의 실제 내용 시각화 */}
                <ClueRenderer clueId={currentClueIdx + 1} />

                {/* 2. 학생의 신뢰도 및 까닭 기록 입력창 */}
                <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 sm:p-6 shadow-md space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-100">
                    <Edit2 className="w-5 h-5 text-amber-600" />
                    <h3 className="font-extrabold text-base text-slate-900">
                      단서 수첩: 신뢰도를 평가하고 까닭을 기록해 주세요
                    </h3>
                  </div>

                  {/* 1번 질문: 이 단서를 얼마나 믿을 수 있다고 생각하나요? (필수 선택) */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <span className="text-red-500 font-black">*</span>
                      <span>1. 이 단서를 얼마나 믿을 수 있다고 생각하나요? (필수 선택)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: '매우 믿을 만하다', color: 'emerald' },
                        { label: '어느 정도 믿을 만하다', color: 'blue' },
                        { label: '더 확인이 필요하다', color: 'amber' },
                        { label: '믿기 어렵다', color: 'rose' }
                      ].map((opt) => {
                        const isSelected =
                          clueResponses[currentClueIdx + 1]?.trustLevel === opt.label;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => {
                              handleUpdateClue('trustLevel', opt.label);
                              setWarningMsg(null);
                            }}
                            className={`p-3 rounded-xl text-xs sm:text-sm font-bold border-2 transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2번 질문: 그렇게 생각한 까닭은 무엇인가요? (필수 작성) */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <span className="text-red-500 font-black">*</span>
                      <span>2. 그렇게 생각한 까닭은 무엇인가요? (필수 작성)</span>
                    </label>
                    <textarea
                      value={clueResponses[currentClueIdx + 1]?.reason || ''}
                      onChange={(e) => {
                        handleUpdateClue('reason', e.target.value);
                        setWarningMsg(null);
                      }}
                      placeholder="그렇게 생각한 까닭을 적어보세요."
                      rows={3}
                      className="w-full p-3.5 text-sm sm:text-base rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none transition leading-relaxed bg-amber-50/20"
                    />
                  </div>

                  {/* 화면 바로 앞 필수 작성 안내 */}
                  {warningMsg && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-sm font-bold flex items-start gap-2.5 animate-bounce shadow-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs font-black text-rose-700 block uppercase">⚠️ 필수 작성 항목 안내</span>
                        <span>{warningMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWarningMsg(null)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 rounded-lg hover:bg-rose-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* 이전 / 다음 버튼 */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handlePrevClue}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{currentClueIdx === 0 ? '처음으로' : '이전 단서로'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextClue}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm sm:text-base shadow-md transition cursor-pointer"
                    >
                      <span>
                        {currentClueIdx === 3 && !stage2Unlocked
                          ? '1단계 완료 (선생님 신호 대기)'
                          : currentClueIdx < 7
                          ? '기록하고 다음 단서로'
                          : '8개 기록 완료하고 신뢰성 판단하기'}
                      </span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: 활동 2 - 신뢰성 판단 */}
        {step === 'activity2' && (
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                  활동 2
                </span>
                <span className="text-xs font-bold text-indigo-900">종합 신뢰성 판단</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                소문의 신뢰성을 스스로 판단해 보세요!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                단서 1~8까지 수집한 자료와 내가 적은 특징을 돌아보고 최종 판단을 내려봅시다.
              </p>
            </div>

            {/* 내가 기록한 단서 1~8의 신뢰도와 판단 까닭 다시 확인하기 */}
            <details className="bg-white rounded-2xl border-2 border-slate-200 p-4 shadow-sm group">
              <summary className="font-extrabold text-sm text-slate-900 cursor-pointer flex items-center justify-between list-none">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>내가 기록한 단서 1~8의 신뢰도와 판단 까닭 다시 확인하기 (클릭하여 열기)</span>
                </span>
                <span className="text-xs font-bold text-indigo-600 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {CLUES.map((clue) => {
                  const res = clueResponses[clue.id];
                  return (
                    <div key={clue.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-800">{clue.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {res?.trustLevel || '미선택'}
                          </span>
                          <button
                            onClick={() => {
                              setCurrentClueIdx(clue.id - 1);
                              setStep('clues');
                            }}
                            className="text-[11px] text-indigo-600 underline hover:text-indigo-800 font-semibold"
                          >
                            단서 보기
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 font-medium leading-relaxed">
                        {res?.reason || '(판단 까닭 미작성)'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </details>

            {/* 활동 2 설문 입력 박스 */}
            <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 sm:p-7 shadow-lg space-y-6">
              {/* 질문 1 */}
              <div>
                <label className="block text-base sm:text-lg font-black text-slate-900 mb-3">
                  질문 1. 효성초등학교 효성벼리 문화예술발표회가 취소되었다는 소문을 얼마나 믿을 수 있나요?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['믿을 만하다.', '더 확인해야 한다.', '믿기 어렵다.'].map((option) => {
                    const isSelected = activity2.rumorTrustLevel === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setActivity2((prev) => ({ ...prev, rumorTrustLevel: option }))
                        }
                        className={`p-4 rounded-2xl font-black text-base border-2 transition text-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 질문 2 */}
              <div>
                <label className="block text-base sm:text-lg font-black text-slate-900 mb-2">
                  질문 2. 그렇게 판단한 이유는 무엇인가요?
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  (출처, 날짜, 작성자, 최신 정보인지, 공식 확인 여부 등을 바탕으로 적어보세요)
                </p>
                <textarea
                  value={activity2.reason}
                  onChange={(e) =>
                    setActivity2((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  placeholder="판단한 이유를 적어보세요."
                  rows={4}
                  className="w-full p-3.5 text-sm sm:text-base rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none transition leading-relaxed"
                />
              </div>

              {/* 질문 3 */}
              <div>
                <label className="block text-base sm:text-lg font-black text-slate-900 mb-2">
                  질문 3. 판단에 가장 중요했던 단서는 무엇인가요? (하나 이상 선택)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CLUES.map((clue) => {
                    const isChecked = activity2.importantClueIds.includes(clue.id);
                    return (
                      <label
                        key={clue.id}
                        onClick={() => {
                          setActivity2((prev) => {
                            const exists = prev.importantClueIds.includes(clue.id);
                            const updated = exists
                              ? prev.importantClueIds.filter((id) => id !== clue.id)
                              : [...prev.importantClueIds, clue.id];
                            return { ...prev, importantClueIds: updated };
                          });
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition text-xs sm:text-sm font-bold ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span>{clue.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 화면 바로 앞 필수 작성 안내 */}
              {warningMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-sm font-bold flex items-start gap-2.5 animate-bounce shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs font-black text-rose-700 block uppercase">⚠️ 필수 작성 항목 안내</span>
                    <span>{warningMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWarningMsg(null)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 rounded-lg hover:bg-rose-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 버튼 바 */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('clues');
                    setCurrentClueIdx(7);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>단서 화면으로 돌아가기</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitActivity2}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-md transition cursor-pointer"
                >
                  <span>활동 3으로 이동하기</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: 활동 3 - 최종 추리 질문 */}
        {step === 'activity3' && (
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white">
                  활동 3
                </span>
                <span className="text-xs font-bold text-emerald-900">최종 추리 질문</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                허위정보와 소문에 대처하는 올바른 탐정의 태도
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                아래 2가지 중요한 질문에 대해 자신의 생각을 자유롭고 정성껏 작성해 주세요.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5 sm:p-7 shadow-lg space-y-6">
              {/* 질문 1 */}
              <div>
                <label className="block text-base sm:text-lg font-black text-slate-900 mb-2 leading-snug">
                  질문 1. 효성벼리 문화예술발표회 취소 소문을 믿고 친구에게 전달하면 어떤 문제가 생길까?
                </label>
                <textarea
                  value={activity3.q1SpreadProblem}
                  onChange={(e) =>
                    setActivity3((prev) => ({ ...prev, q1SpreadProblem: e.target.value }))
                  }
                  placeholder="소문을 믿고 친구에게 전달했을 때 생길 수 있는 문제를 적어보세요."
                  rows={4}
                  className="w-full p-4 text-sm sm:text-base rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none transition leading-relaxed bg-emerald-50/20"
                />
              </div>

              {/* 질문 2 */}
              <div>
                <label className="block text-base sm:text-lg font-black text-slate-900 mb-2 leading-snug">
                  질문 2. 놀랍거나 급한 정보를 보았을 때 어떤 태도를 가져야 할까?
                </label>
                <textarea
                  value={activity3.q2Attitude}
                  onChange={(e) =>
                    setActivity3((prev) => ({ ...prev, q2Attitude: e.target.value }))
                  }
                  placeholder="놀랍거나 급한 정보를 보았을 때 가져야 할 올바른 태도를 적어보세요."
                  rows={4}
                  className="w-full p-4 text-sm sm:text-base rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none transition leading-relaxed bg-emerald-50/20"
                />
              </div>

              {/* 학생 이름 및 소속 조 확인란 */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-amber-900 shrink-0">
                    탐정 이름:
                  </span>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="예: 김유민"
                    className="w-full sm:w-44 px-3 py-1.5 text-xs font-bold bg-white rounded-lg border border-amber-300 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-amber-900 shrink-0">
                    소속 조:
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setStudentGroup(g);
                          handleAssignCurrentStudentGroup(g);
                        }}
                        className={`px-2.5 py-1 text-xs font-black rounded-lg border transition cursor-pointer ${
                          studentGroup === g
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-1 ring-amber-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        {g}조
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 화면 바로 앞 필수 작성 안내 */}
              {warningMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-sm font-bold flex items-start gap-2.5 animate-bounce shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-xs font-black text-rose-700 block uppercase">⚠️ 필수 작성 항목 안내</span>
                    <span>{warningMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWarningMsg(null)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 rounded-lg hover:bg-rose-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 버튼 바 */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('activity2')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>활동 2로 돌아가기</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitActivity3}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-md transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>최종 추리 제출하기</span>
                </button>
              </div>
            </div>
          </div>
        )}
            </div>

            {/* 화면 바로 옆: 실시간 활동 타이머 & 필수 항목 경고 & 탐정 현황 HUD */}
            <SideCompanionHUD
              classTimer={classTimer}
              remainingSeconds={remainingSeconds}
              warningMsg={warningMsg}
              onClearWarning={() => setWarningMsg(null)}
              studentName={studentName}
              studentGroup={studentGroup}
              stage2Unlocked={stage2Unlocked}
              step={step}
              currentClueIdx={currentClueIdx}
              clueResponses={clueResponses}
              activity2={activity2}
              activity3={activity3}
              onSelectClue={(idx) => {
                if (idx >= 4 && !stage2Unlocked) {
                  setWarningMsg('🔒 2단계(단서 5~8번)는 선생님께서 1단계 활동 완료 후 열어주시면 시작할 수 있습니다.');
                  return;
                }
                setIsWaitingForStage2(false);
                setCurrentClueIdx(idx);
                setStep('clues');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isTeacherAuthenticated={isTeacherAuthenticated}
              onOpenTeacherAuth={() => {
                requireTeacherAuth(
                  () => {
                    setWarningMsg('👑 교사 권한이 인증되었습니다.');
                  },
                  '교사 타이머 권한 인증',
                  '타이머 시간 설정, 시작, 일시정지, 초기화는 선생님만 가능합니다. 비밀번호를 입력해 주세요.',
                  '인증하고 타이머 제어하기'
                );
              }}
            />
          </div>
        )}

        {/* STEP 5: 활동 완료 화면 */}
        {step === 'completed' && (
          <div className="bg-white rounded-3xl border-2 sm:border-4 border-amber-300 p-6 sm:p-10 shadow-2xl max-w-2xl mx-auto my-auto text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <Award className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 mb-2">
                효성초등학교 팩트 탐정 수료 (제출 완료)
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                “탐정 활동 완료! 단서를 살펴보고, 근거를 모아, 스스로 판단했어요.”
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg mx-auto">
              <strong>{studentName || '탐정'}</strong> 학생의 수첩이 교사용 시스템에 정상 제출되었습니다!
              출처, 날짜, 작성자, 공식 확인 여부를 직접 살피고 멋진 추리를 완성했습니다.
            </p>

            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-left space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center py-1 border-b border-amber-200/60">
                <span className="font-bold text-slate-600">제출 학생 이름:</span>
                <span className="font-black text-indigo-700">{studentName || '이름 미입력'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-amber-200/60">
                <span className="font-bold text-slate-600">소문에 대한 최종 판단:</span>
                <span className="font-black text-indigo-700">{activity2.rumorTrustLevel}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-slate-600">선택한 핵심 단서:</span>
                <span className="font-black text-emerald-700">
                  {activity2.importantClueIds.length > 0
                    ? `${activity2.importantClueIds.length}개 단서 활용`
                    : '전체 단서 종합'}
                </span>
              </div>
            </div>

            {/* 1~5조 조별 결과 공유 카드 */}
            <div className="bg-gradient-to-r from-amber-50 to-indigo-50 rounded-2xl p-5 border-2 border-indigo-200 text-left space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    👥
                  </div>
                  <div>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                      활동 후 모둠 협력
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      1~5조 조별 결과 공유방
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep('group-share');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>우리 조 결과 공유방 입장하기</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                선생님이 학생들의 수첩을 <strong>1~5조 모둠 폴더</strong>로 배정해 주셨습니다. 자신의 조 폴더에 들어가 친구들의 신뢰도 판단과 근거를 살펴보고, 토론을 통해 우리 조의 최종 발표 결론을 모아보세요!
              </p>

              {/* 1~5조 바로가기 탭들 */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-indigo-100">
                <span className="text-xs font-bold text-slate-500">빠른 조 이동:</span>
                {[1, 2, 3, 4, 5].map((gNum) => {
                  const count = submittedNotebooks.filter((n) => n.groupId === gNum).length;
                  return (
                    <button
                      key={gNum}
                      onClick={() => {
                        setStep('group-share');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-950 transition cursor-pointer"
                    >
                      📁 {gNum}조 ({count}명)
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  setStep('group-share');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-5 h-5" />
                <span>👥 조별 결과 공유방 (1~5조)</span>
              </button>

              <button
                onClick={() => setStep('notebook')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-5 h-5" />
                <span>나의 탐정 수첩 확인하기</span>
              </button>

              <button
                onClick={handleOpenTeacherDashboard}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-5 h-5" />
                <span>🔒 교사용 화면에서 확인하기</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: 탐정 수첩 전체 뷰 / 인쇄 뷰 */}
        {step === 'notebook' && (
          <NotebookView
            studentName={studentName}
            setStudentName={setStudentName}
            clueResponses={clueResponses}
            activity2={activity2}
            activity3={activity3}
            onGoToStep={(targetStep) => {
              if (targetStep === 'clues') {
                setCurrentClueIdx(0);
                setStep('clues');
              } else if (targetStep === 'activity2') {
                setStep('activity2');
              } else if (targetStep === 'activity3') {
                setStep('activity3');
              }
            }}
            onBackToCompletion={() => setStep('completed')}
          />
        )}

        {/* STEP 7: 교사용 대시보드 */}
        {step === 'teacher' && (
          <TeacherDashboard
            notebooks={submittedNotebooks}
            onBackToApp={() => setStep('completed')}
            onUpdateFeedback={handleUpdateFeedback}
            onLockTeacherMode={handleLockTeacherMode}
            classTimer={classTimer}
            remainingSeconds={remainingSeconds}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onResetTimer={handleResetTimer}
            onAddMinutes={handleAddMinutes}
            onAssignStudentToGroup={handleAssignStudentToGroup}
            onBatchAutoDistribute={handleBatchAutoDistribute}
            onAddSampleStudents={handleAddSampleStudents}
            onOpenGroupShare={() => {
              setStep('group-share');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            currentPin={teacherPin}
            onChangePin={handleChangePin}
            onClearAllSubmissions={handleClearAllSubmissions}
            stage2Unlocked={stage2Unlocked}
            onToggleStage2Lock={handleToggleStage2Lock}
            realtimeStudents={realtimeStudents}
          />
        )}

        {/* STEP 8: 1~5조 조별 결과 공유 화면 */}
        {step === 'group-share' && (
          <GroupShareView
            currentStudentName={studentName}
            studentGroup={studentGroup}
            notebooks={submittedNotebooks}
            onBack={() => setStep('completed')}
            onAssignCurrentStudentGroup={handleAssignCurrentStudentGroup}
            groupComments={groupComments}
            onAddComment={handleAddGroupComment}
            onLikeComment={handleLikeGroupComment}
            groupConclusions={groupConclusions}
            onSaveConclusion={handleSaveGroupConclusion}
          />
        )}
      </main>

      {/* 교사용 전용 비밀번호 인증 모달 */}
      <TeacherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingTeacherAction(null);
        }}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setIsTeacherAuthenticated(true);
          if (pendingTeacherAction) {
            const action = pendingTeacherAction;
            setPendingTeacherAction(null);
            action();
          } else {
            setStep('teacher');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        currentPin={teacherPin}
        onChangePin={handleChangePin}
        title={authModalConfig.title}
        description={authModalConfig.description}
        confirmButtonText={authModalConfig.confirmButtonText}
      />

      {/* 하단 푸터 (인쇄 시 숨김) */}
      <footer className="no-print border-t border-amber-200/60 bg-amber-50/50 py-4 px-6 text-center text-xs text-slate-500 mt-10">
        <p className="font-medium">
          본 웹사이트의 모든 내용(학교명, 행사, 공지문 등)은 초등학교 미디어 문해력 및 허위정보 판별 교육을 위한 <strong>가상 수업 자료</strong>입니다.
        </p>
      </footer>
    </div>
  );
}

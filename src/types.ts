export interface ClueData {
  id: number;
  title: string;
  typeBadge: string;
  category: 'official' | 'chat' | 'capture' | 'memo' | 'photo';
  // 교사용 관찰 포인트 (교사용 대시보드에서만 열람 가능)
  teacherObservationPoints: string[];
}

export interface StudentClueResponse {
  trustLevel: string; // 1번 질문: 이 단서를 얼마나 믿을 수 있다고 생각하나요? (필수 선택)
  reason: string; // 2번 질문: 그렇게 생각한 까닭은 무엇인가요? (필수 작성)
  features?: string; // 기존 호환용 선택 필드
}

export interface Activity2Response {
  rumorTrustLevel: string; // '믿을 만하다.' | '더 확인해야 한다.' | '믿기 어렵다.'
  reason: string;
  importantClueIds: number[]; // 선택한 단서 번호들 (1~8)
}

export interface Activity3Response {
  q1SpreadProblem: string; // 재능발표회 취소 소문을 믿고 친구에게 전달하면 어떤 문제가 생길까?
  q2Attitude: string; // 놀랍거나 급한 정보를 보았을 때 어떤 태도를 가져야 할까?
}

export interface SubmittedNotebook {
  id: string;
  studentName: string;
  submittedAt: string;
  clueResponses: Record<number, StudentClueResponse>;
  activity2: Activity2Response;
  activity3: Activity3Response;
  teacherFeedback?: string;
  isAutoSubmitted?: boolean; // 시간 초과로 자동 제출되었는지 여부
  groupId?: number | null; // 1~5조 (미배정시 null 또는 undefined)
  groupAssignedAt?: string;
}

export interface ClassTimerState {
  isRunning: boolean;
  startTime: number | null; // 시작 타임스탬프
  durationMinutes: number; // 25분
  endTime: number | null; // 종료 타임스탬프
  isExpired: boolean;
}

export interface GroupComment {
  id: string;
  groupId: number; // 1~5
  author: string;
  content: string;
  createdAt: string;
  clueReference?: string;
  likes?: number;
}

export interface GroupConclusion {
  groupId: number; // 1~5
  consensusVerdict: string; // '믿기 어렵다.' | '더 확인해야 한다.' | '믿을 만하다.' | '의견 조율 중'
  mainReason: string;
  keyClues: number[];
  presentationNote: string;
  updatedAt: string;
}

export type Step =
  | 'intro' // 첫 화면
  | 'clues' // 단서 1~8 탐색
  | 'activity2' // 신뢰성 판단
  | 'activity3' // 최종 추리 질문
  | 'completed' // 활동 완료 및 탐정 수첩 화면
  | 'notebook' // 전체 탐정 수첩 전용/인쇄 뷰
  | 'teacher' // 교사용 제출 수첩 모아보기 대시보드
  | 'group-share'; // 조별 결과 공유 (1~5조)

export interface StudentRealtimeProgress {
  studentName: string;
  studentGroup: number;
  lastActive: number;
  step: Step;
  currentClueIdx: number;
  clueResponses: Record<number, StudentClueResponse>;
  stage1Completed: boolean; // 단서 1~4번 모두 완료 여부
  stage2Completed: boolean; // 단서 5~8번 모두 완료 여부
  allCluesCompleted: boolean; // 8개 단서 전체 완료 여부
  activity2?: Activity2Response;
  activity3?: Activity3Response;
  isSubmitted?: boolean;
}

export interface ClassSessionState {
  stage2Unlocked: boolean; // 2단계(단서 5~8) 잠금 해제 여부 (교사 제어)
  students: Record<string, StudentRealtimeProgress>;
  classTimer?: ClassTimerState;
  submissions: SubmittedNotebook[];
  groupComments: GroupComment[];
  groupConclusions: Record<number, GroupConclusion>;
}

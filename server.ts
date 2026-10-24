import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServerStudentProgress {
  studentName: string;
  studentGroup: number;
  lastActive: number;
  step: string;
  currentClueIdx: number;
  clueResponses: Record<number, { trustLevel: string; reason: string }>;
  stage1Completed: boolean;
  stage2Completed: boolean;
  allCluesCompleted: boolean;
  activity2?: any;
  activity3?: any;
  isSubmitted?: boolean;
}

interface ServerSessionData {
  stage2Unlocked: boolean; // 교사가 5~8번 2단계 잠금 해제했는지 여부
  students: Record<string, ServerStudentProgress>;
  classTimer?: any;
  submissions: any[];
  groupComments: any[];
  groupConclusions: Record<number, any>;
  lastUpdated: number;
}

const DATA_FILE = path.resolve(__dirname, '.session_store.json');

// 기본 초기 상태
const defaultSession: ServerSessionData = {
  stage2Unlocked: false,
  students: {},
  classTimer: {
    isRunning: false,
    startTime: null,
    durationMinutes: 25,
    endTime: null,
    isExpired: false
  },
  submissions: [],
  groupComments: [],
  groupConclusions: {},
  lastUpdated: Date.now()
};

let sessionData: ServerSessionData = { ...defaultSession };

// 디스크에서 기존 세션 복원
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    sessionData = {
      ...defaultSession,
      ...parsed,
      students: parsed.students || {},
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      groupComments: Array.isArray(parsed.groupComments) ? parsed.groupComments : [],
      groupConclusions: parsed.groupConclusions || {}
    };
  }
} catch (e) {
  console.error('Failed to load session store, starting fresh:', e);
}

// 비동기 디스크 저장
let saveTimeout: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      sessionData.lastUpdated = Date.now();
      fs.writeFileSync(DATA_FILE, JSON.stringify(sessionData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write session store:', e);
    }
  }, 200);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // 1. 전체 세션 상태 조회 (실시간 폴링 엔드포인트)
  app.get('/api/session', (req, res) => {
    // 24시간 이상 미활동 임시 학생 정리 (단, 제출된 학생은 유지)
    const now = Date.now();
    const students = { ...sessionData.students };
    const cutoff = now - 24 * 60 * 60 * 1000;
    for (const [name, st] of Object.entries(students)) {
      if (!st.isSubmitted && st.lastActive < cutoff) {
        delete students[name];
      }
    }
    sessionData.students = students;

    res.json({
      stage2Unlocked: sessionData.stage2Unlocked,
      students: sessionData.students,
      classTimer: sessionData.classTimer,
      submissions: sessionData.submissions,
      groupComments: sessionData.groupComments,
      groupConclusions: sessionData.groupConclusions,
      lastUpdated: sessionData.lastUpdated
    });
  });

  // 2. 교사용: 2단계(단서 5~8) 잠금 해제 / 잠금 토글
  app.post('/api/stage', (req, res) => {
    const { stage2Unlocked } = req.body;
    sessionData.stage2Unlocked = Boolean(stage2Unlocked);
    scheduleSave();
    res.json({
      success: true,
      stage2Unlocked: sessionData.stage2Unlocked
    });
  });

  // 3. 학생용: 실시간 진행도 업데이트
  app.post('/api/student-progress', (req, res) => {
    const {
      studentName,
      studentGroup,
      clueResponses = {},
      activity2,
      activity3,
      step,
      currentClueIdx,
      isSubmitted
    } = req.body;

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ error: 'studentName is required' });
    }

    const trimmedName = studentName.trim();

    // 1단계(단서 1~4) 완료 여부 검사
    const stage1Completed = [1, 2, 3, 4].every((id) => {
      const resp = clueResponses[id];
      return Boolean(resp && resp.trustLevel && resp.reason && resp.reason.trim());
    });

    // 2단계(단서 5~8) 완료 여부 검사
    const stage2Completed = [5, 6, 7, 8].every((id) => {
      const resp = clueResponses[id];
      return Boolean(resp && resp.trustLevel && resp.reason && resp.reason.trim());
    });

    const allCluesCompleted = stage1Completed && stage2Completed;

    const current: ServerStudentProgress = {
      studentName: trimmedName,
      studentGroup: Number(studentGroup) || 1,
      lastActive: Date.now(),
      step: step || 'clues',
      currentClueIdx: typeof currentClueIdx === 'number' ? currentClueIdx : 0,
      clueResponses: clueResponses || {},
      stage1Completed,
      stage2Completed,
      allCluesCompleted,
      activity2,
      activity3,
      isSubmitted: Boolean(isSubmitted)
    };

    sessionData.students[trimmedName] = current;
    scheduleSave();

    res.json({
      success: true,
      stage2Unlocked: sessionData.stage2Unlocked,
      stage1Completed,
      allCluesCompleted
    });
  });

  // 4. 수첩 제출 / 동기화
  app.post('/api/submissions', (req, res) => {
    const { submission } = req.body;
    if (submission && submission.studentName) {
      const idx = sessionData.submissions.findIndex(
        (s) => s.studentName === submission.studentName
      );
      if (idx >= 0) {
        sessionData.submissions[idx] = submission;
      } else {
        sessionData.submissions.unshift(submission);
      }

      // 학생 실시간 목록에도 제출 완료 플래그 반영
      if (sessionData.students[submission.studentName]) {
        sessionData.students[submission.studentName].isSubmitted = true;
      }
      scheduleSave();
    }
    res.json({ success: true, count: sessionData.submissions.length });
  });

  // 5. 모둠 토론 댓글 작성
  app.post('/api/comments', (req, res) => {
    const { comment } = req.body;
    if (comment && comment.id) {
      sessionData.groupComments.unshift(comment);
      scheduleSave();
    }
    res.json({ success: true, comments: sessionData.groupComments });
  });

  // 6. 모둠 토론 공감
  app.post('/api/like-comment', (req, res) => {
    const { commentId } = req.body;
    sessionData.groupComments = sessionData.groupComments.map((c) =>
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    );
    scheduleSave();
    res.json({ success: true });
  });

  // 7. 모둠 종합 결론 저장
  app.post('/api/conclusions', (req, res) => {
    const { conclusion } = req.body;
    if (conclusion && conclusion.groupId) {
      sessionData.groupConclusions[conclusion.groupId] = conclusion;
      scheduleSave();
    }
    res.json({ success: true });
  });

  // 8. 교사 타이머 상태 동기화
  app.post('/api/timer', (req, res) => {
    const { timer } = req.body;
    if (timer) {
      sessionData.classTimer = timer;
      scheduleSave();
    }
    res.json({ success: true });
  });

  // 9. 교사용 전체 초기화
  app.post('/api/reset-session', (req, res) => {
    sessionData = {
      ...defaultSession,
      lastUpdated: Date.now()
    };
    scheduleSave();
    res.json({ success: true });
  });

  // Vite 개발 미들웨어 마운트 (또는 프로덕션 정적 서빙)
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fact Detective Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

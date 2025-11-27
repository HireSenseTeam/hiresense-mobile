// API 서비스 - 백엔드 API 호출 공통 로직
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. .env 파일에 EXPO_PUBLIC_API_URL을 설정해주세요.');
}

// 타임아웃 설정 (30초)
const FETCH_TIMEOUT = 30000;

// 토큰 가져오기
const getAuthToken = async (): Promise<string | null> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('authToken');
  } catch {
    return null;
  }
};

// 토큰 갱신 시도
const tryRefreshToken = async (): Promise<boolean> => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    await AsyncStorage.setItem('authToken', data.token);
    if (data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
    }
    return true;
  } catch {
    return false;
  }
};

// 타임아웃이 있는 fetch 래퍼 (자동 토큰 갱신 포함)
const fetchWithTimeout = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  // 토큰이 있으면 헤더에 추가
  const token = await getAuthToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    // 401 에러 발생 시 토큰 갱신 시도
    if (response.status === 401 && token) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // 토큰 갱신 성공 시 재시도
        const newToken = await getAuthToken();
        headers.set('Authorization', `Bearer ${newToken}`);
        clearTimeout(timeoutId);
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), FETCH_TIMEOUT);
        try {
          const retryResponse = await fetch(url, {
            ...options,
            headers,
            signal: retryController.signal,
          });
          clearTimeout(retryTimeoutId);
          return retryResponse;
        } catch (retryError: any) {
          clearTimeout(retryTimeoutId);
          if (retryError.name === 'AbortError') {
            throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
          }
          throw retryError;
        }
      }
    }
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
    }
    throw error;
  }
};

export interface JobPosting {
  id: number;
  companyName: string;
  jobTitle: string;
  workLocation: string;
  recruitmentPeriod: string;
  qualifications: string;
  idealCandidate: string;
  preferredQualifications?: string;
  jobDescription: string;
}

export interface AcademicRecord {
  schoolName?: string;
  period?: string;
  status?: string;
  gpa?: number;
  major?: string;
}

export interface JobPreference {
  desiredJob?: string;
  experienceLevel?: string;
  description?: string;
}

export interface WorkCondition {
  employmentType?: string;
  desiredHours?: string;
}

export interface Resume {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender?: string;
  birthYear?: string;
  homePhone?: string;
  academicRecord?: AcademicRecord;
  jobPreference?: JobPreference;
  desiredRegion?: string;
  desiredSalary?: number;
  workCondition?: WorkCondition;
  createdAt?: string;
  modifiedAt?: string;
}

export interface InterviewStartResponse {
  sessionId: string;
  question: string;
}

export interface InterviewAnswerResponse {
  question?: string;
  message?: string;
}

export interface InterviewScore {
  overallScore: number | string; // BigDecimal이 문자열로 올 수 있음
  overallComment: string;
  strengths: string;
  weaknesses: string;
  idealCandidateFit: number;
  jobDescriptionFit: number;
}

export interface InterviewSession {
  sessionId: string;
  jobPostingId: number;
  resumeId: number;
  applicantEmail: string;
  status: string;
  currentIndex: number;
  totalQuestions: number;
  createdAt?: string;
  modifiedAt?: string;
  jobPosting?: JobPosting;
  resume?: Resume;
  // 호환성을 위한 id 필드 (sessionId와 동일)
  id?: string;
}

export interface RankingItem {
  applicantEmail: string;
  overallScore: number;
  applicantName: string;
  rank: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: number;
  email: string;
  name: string;
  role: string;
}

// 채용공고 API
export const jobPostingApi = {
  // 채용공고 목록 조회
  getAll: async (): Promise<JobPosting[]> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/job-postings`);
    if (!response.ok) throw new Error('채용공고 목록 조회 실패');
    return response.json();
  },

  // 채용공고 상세 조회
  getById: async (id: number): Promise<JobPosting> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/job-postings/${id}`);
    if (!response.ok) throw new Error('채용공고 조회 실패');
    return response.json();
  },

  // 채용공고 생성
  create: async (data: Partial<JobPosting>): Promise<JobPosting> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/job-postings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = '채용공고 생성 실패';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },
};

// 이력서 API
export const resumeApi = {
  // 이메일로 이력서 조회
  getByEmail: async (email: string): Promise<Resume> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/resumes/email/${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('이력서 조회 실패');
    return response.json();
  },

  // 이력서 생성
  create: async (data: any): Promise<Resume> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/resumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = '이력서 생성 실패';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },
};

// 면접 API
export const interviewApi = {
  // 면접 시작
  start: async (jobId: number, applicantEmail: string): Promise<InterviewStartResponse> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/interview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, applicantEmail }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = '면접 시작 실패';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // 답변 제출
  submitAnswer: async (sessionId: string, answerText: string): Promise<InterviewAnswerResponse> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/interview/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, answerText }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = '답변 제출 실패';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // 점수 조회
  getScore: async (sessionId: string): Promise<InterviewScore> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/interview/score?sessionId=${sessionId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('NOT_FOUND'); // 아직 채점 중
      }
      // BusinessException 처리 (채점 진행 중)
      try {
        const errorData = await response.json();
        if (errorData.message && errorData.message.includes('채점이 아직 진행 중')) {
          throw new Error('SCORING_IN_PROGRESS'); // 채점 진행 중
        }
        throw new Error(errorData.message || '점수 조회 실패');
      } catch (parseError) {
        throw new Error('점수 조회 실패');
      }
    }
    return response.json();
  },

  // 면접 세션 조회
  getSession: async (sessionId: string): Promise<InterviewSession> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/interview/session/${sessionId}`);
    if (!response.ok) throw new Error('면접 세션 조회 실패');
    return response.json();
  },

  // 면접 답변 조회
  getAnswers: async (sessionId: string): Promise<any[]> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/interview/session/${sessionId}/answers`);
    if (!response.ok) throw new Error('면접 답변 조회 실패');
    return response.json();
  },

  // 지원자별 면접 목록
  getSessionsByApplicant: async (email: string): Promise<InterviewSession[]> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/interview/sessions?applicantEmail=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('면접 목록 조회 실패');
    return response.json();
  },

  // 채용공고별 면접 목록
  getSessionsByJobPosting: async (jobPostingId: number): Promise<InterviewSession[]> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/interview/sessions?jobPostingId=${jobPostingId}`);
    if (!response.ok) throw new Error('면접 목록 조회 실패');
    return response.json();
  },
};

// 랭킹 API
export const rankingApi = {
  // 랭킹 조회
  getByJobId: async (jobId: number): Promise<RankingItem[]> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/rankings/${jobId}`);
    if (!response.ok) throw new Error('랭킹 조회 실패');
    return response.json();
  },
};

// 인증 API
export const authApi = {
  // 회원가입
  signup: async (email: string, password: string, name: string, role: string): Promise<AuthResponse> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = '회원가입 실패';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // 로그인
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = '로그인 실패';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // 토큰 갱신
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      throw new Error('토큰 갱신 실패');
    }
    return response.json();
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      // 로그아웃 실패해도 로컬 스토리지는 삭제
      console.warn('로그아웃 API 호출 실패');
    }
  },
};


/**
 * 네비게이션 타입 정의
 */
export type RootStackParamList = {
  index: undefined;
  login: undefined;
  signup: undefined;
  resume: { edit?: string; mode?: string; resumeId?: string; applicantEmail?: string } | undefined;
  'job-posting': { jobId?: string; edit?: string } | undefined;
  chat: { name: string; jobId: string; email?: string };
  'job-list': undefined;
  interviews: undefined;
  'select-job': { name: string; email: string };
  'interview-detail': { sessionId: string };
  'job-detail': { jobId: string };
  ranking: { jobId: string };
  'my-resume': { applicantEmail?: string };
  'my-job-postings': undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}


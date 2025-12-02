import { useState, useEffect, useCallback } from 'react';
import { jobPostingApi, JobPosting } from '../services/api';
import { handleApiError } from '../utils/errorHandler';

interface UseMyJobPostingsResult {
  jobPostings: JobPosting[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * 내 채용공고 목록을 관리하는 커스텀 훅
 */
export const useMyJobPostings = (): UseMyJobPostingsResult => {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobPostings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobPostingApi.getMyJobPostings();
      setJobPostings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '내 채용공고 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      setJobPostings([]);
      handleApiError(err, '내 채용공고 목록 조회');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobPostings();
  }, [loadJobPostings]);

  return {
    jobPostings,
    loading,
    error,
    refresh: loadJobPostings,
  };
};


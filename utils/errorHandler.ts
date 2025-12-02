import { Alert } from 'react-native';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
}

/**
 * 공통 에러 처리 함수
 */
export const handleError = (error: unknown, defaultMessage: string = '오류가 발생했습니다.'): void => {
  let errorMessage = defaultMessage;
  
  if (error instanceof Error) {
    errorMessage = error.message || defaultMessage;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // 개발 환경에서만 콘솔에 출력
  if (__DEV__) {
    console.error('[Error Handler]', errorMessage, error);
  }
  
  Alert.alert('오류', errorMessage);
};

/**
 * 네트워크 에러 처리
 */
export const handleNetworkError = (error: unknown): void => {
  handleError(error, '네트워크 연결을 확인해주세요.');
};

/**
 * API 에러 처리
 */
export const handleApiError = (error: unknown, operation: string = '작업'): void => {
  let errorMessage = `${operation} 중 오류가 발생했습니다.`;
  
  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
  }
  
  if (__DEV__) {
    console.error(`[API Error] ${operation}:`, error);
  }
  
  Alert.alert('오류', errorMessage);
};


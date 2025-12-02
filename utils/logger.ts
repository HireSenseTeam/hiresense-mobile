/**
 * 개발 환경에서만 로그를 출력하는 유틸리티
 */
export const logger = {
  log: (...args: any[]): void => {
    if (__DEV__) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]): void => {
    if (__DEV__) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]): void => {
    if (__DEV__) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]): void => {
    if (__DEV__) {
      console.info(...args);
    }
  },
};


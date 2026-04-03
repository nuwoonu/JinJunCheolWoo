import { useEffect, useState } from 'react';

/**
 * 관리자 페이지 공통 메시지 훅
 * - msg  : 성공 메시지 (AdminLayout green banner)
 * - error: 실패 메시지 (AdminLayout red banner)
 * - 메시지가 설정되면 자동으로 페이지 상단으로 스크롤
 */
export function useAdminMsg() {
  const [msg, setMsgState] = useState('');
  const [error, setErrorState] = useState('');

  useEffect(() => {
    if (msg || error) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [msg, error]);

  const setMsg = (text: string) => {
    setMsgState(text);
    setErrorState('');
  };

  const setError = (text: string) => {
    setErrorState(text);
    setMsgState('');
  };

  return { msg, error, setMsg, setError };
}

/**
 * Axios 에러에서 백엔드 메시지를 추출하는 유틸
 */
export function apiErrMsg(err: any, fallback = '오류가 발생했습니다.'): string {
  return err?.response?.data?.message ?? err?.message ?? fallback;
}

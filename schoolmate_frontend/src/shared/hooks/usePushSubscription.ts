import { useEffect } from 'react';
import api from '@/shared/api/authApi';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** base64url 문자열 → Uint8Array 변환 (applicationServerKey 형식) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function registerPushSubscription(): Promise<void> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY 환경변수가 설정되지 않았습니다.');
    return;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.ready;

  // 이미 구독 중이면 서버에 재동기화
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  await api.post('/push/subscribe', {
    endpoint: json.endpoint,
    p256dhKey: json.keys?.p256dh,
    authKey: json.keys?.auth,
  });
}

/**
 * 인증된 유저에 한해 Push 구독 요청 및 서버 등록을 처리합니다.
 * main.tsx 또는 AuthContext 내부에서 isAuthenticated가 true가 된 시점에 호출됩니다.
 */
export function usePushSubscription(isAuthenticated: boolean): void {
  useEffect(() => {
    if (!isAuthenticated) return;
    registerPushSubscription().catch((e) =>
      console.error('[Push] 구독 등록 실패:', e)
    );
  }, [isAuthenticated]);
}

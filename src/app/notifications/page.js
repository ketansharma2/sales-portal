'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentNotificationRoute } from '@/lib/notificationRoutes';

export default function NotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getCurrentNotificationRoute());
  }, [router]);

  return <div>Redirecting...</div>;
}
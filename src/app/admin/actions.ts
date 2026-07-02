'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionValue,
  getAdminSessionMaxAge,
} from '@/utils/auth/admin';
import { checkRateLimit } from '@/utils/rate-limit';

async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  return (
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    'unknown'
  );
}

export async function verifyAdminKey(key: string) {
  const correctKey = process.env.MIU_ADMIN_KEY;
  if (!correctKey) {
    throw new Error('Admin key is not configured on the server.');
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    return { success: false, error: 'Too many attempts. Please try again later.' };
  }

  if (key === correctKey) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionValue(correctKey), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getAdminSessionMaxAge(),
      path: '/',
    });
    return { success: true };
  }

  return { success: false, error: 'Invalid admin key.' };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

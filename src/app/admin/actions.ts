'use server';

import { cookies } from 'next/headers';

export async function verifyAdminKey(key: string) {
  const correctKey = process.env.MIU_ADMIN_KEY;
  if (!correctKey) {
    throw new Error('Admin key is not configured on the server.');
  }

  if (key === correctKey) {
    const cookieStore = await cookies();
    cookieStore.set('miu_admin_access', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    return { success: true };
  }

  return { success: false, error: 'Invalid admin key.' };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('miu_admin_access');
}

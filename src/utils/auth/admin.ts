import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'miu_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createAdminSessionValue(secret: string): string {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expires);
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyAdminSessionValue(value: string, secret: string): boolean {
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;

  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const expected = signPayload(payload, secret);
  if (signature.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function getAdminSessionMaxAge(): number {
  return SESSION_MAX_AGE_SECONDS;
}

export async function hasAdminAccess(): Promise<boolean> {
  const secret = process.env.MIU_ADMIN_KEY;
  if (!secret) return false;

  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!value) return false;

  return verifyAdminSessionValue(value, secret);
}

export async function requireAdminAccess(): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.MIU_ADMIN_KEY;
  if (!secret) {
    return { ok: false, error: 'Admin access is not configured on the server.' };
  }

  const allowed = await hasAdminAccess();
  if (!allowed) {
    return { ok: false, error: 'Unauthorized admin access.' };
  }

  return { ok: true };
}

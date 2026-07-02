import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionValue,
} from '@/utils/auth/admin-edge';

const PROTECTED_STUDENT_PATHS = ['/history', '/analytics'];

function isProtectedStudentPath(pathname: string) {
  return PROTECTED_STUDENT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isProtectedAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    return NextResponse.next({ request });
  }

  if (isProtectedStudentPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.set('login', 'required');
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtectedAdminPath(pathname) && pathname !== '/admin') {
    const adminKey = process.env.MIU_ADMIN_KEY;
    const sessionValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const hasAdminAccess =
      !!adminKey &&
      !!sessionValue &&
      (await verifyAdminSessionValue(sessionValue, adminKey));

    if (!hasAdminAccess) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

import React from 'react';
import { cookies } from 'next/headers';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get('miu_admin_access')?.value === 'true';

  if (!hasAccess) {
    return <AdminLoginForm />;
  }

  return <>{children}</>;
}

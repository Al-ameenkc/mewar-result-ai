import React from 'react';
import { hasAdminAccess } from '@/utils/auth/admin';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const allowed = await hasAdminAccess();

  if (!allowed) {
    return <AdminLoginForm />;
  }

  return <>{children}</>;
}

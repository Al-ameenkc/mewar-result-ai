import { redirect } from 'next/navigation';
import { hasAdminAccess } from '@/utils/auth/admin';

export default async function AdminIndexPage() {
  const allowed = await hasAdminAccess();
  if (allowed) {
    redirect('/admin/courses');
  }

  return null;
}

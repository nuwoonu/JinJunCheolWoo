import AdminTopBar from '@/components/layout/admin/AdminTopBar';
import { ADMIN_ROUTES } from '@/constants/routes';

const SCHOOL_NAV_LINKS = [
  { to: ADMIN_ROUTES.STUDENTS.LIST, icon: "ri-graduation-cap-line", label: "학생 관리" },
  { to: ADMIN_ROUTES.TEACHERS.LIST, icon: "ri-user-follow-line",    label: "교사 관리" },
  { to: ADMIN_ROUTES.STAFFS.LIST,   icon: "ri-user-2-line",         label: "교직원 관리" },
  { to: ADMIN_ROUTES.CLASSES.LIST,  icon: "ri-building-2-line",     label: "학급 관리" },
  { to: ADMIN_ROUTES.NOTICES.LIST,  icon: "ri-megaphone-line",      label: "공지 관리" },
] as const;

const PARENT_QUICK_LINK = {
  to: ADMIN_ROUTES.PARENTS.LIST,
  icon: "ri-user-heart-line",
  label: "학부모 관리",
};

export default function AdminHeader() {
  return (
    <AdminTopBar
      position="fixed"
      navLinks={SCHOOL_NAV_LINKS}
      quickLink={PARENT_QUICK_LINK}
    />
  );
}

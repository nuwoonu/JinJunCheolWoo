import { useMemo } from 'react';
import AdminTopBar from '@/components/layout/admin/AdminTopBar';
import { ADMIN_ROUTES } from '@/constants/routes';
import { ADMIN_GRANTS } from '@/constants/adminPermissions';
import { useAuth } from '@/contexts/AuthContext';
import type { GrantInfo } from '@/api/auth';

function hasGrant(grants: GrantInfo[], ...roles: string[]) {
  return grants.some(g => roles.includes(g.grantedRole));
}

/** grant 기반 필터링이 적용된 nav 링크 목록 정의 */
const ALL_NAV_LINKS = [
  { to: ADMIN_ROUTES.STUDENTS.LIST, icon: "ri-graduation-cap-line", label: "학생 관리",  grants: ADMIN_GRANTS.STUDENTS  },
  { to: ADMIN_ROUTES.TEACHERS.LIST, icon: "ri-user-follow-line",    label: "교사 관리",  grants: ADMIN_GRANTS.TEACHERS  },
  { to: ADMIN_ROUTES.STAFFS.LIST,   icon: "ri-user-2-line",         label: "교직원 관리", grants: ADMIN_GRANTS.STAFFS   },
  { to: ADMIN_ROUTES.CLASSES.LIST,  icon: "ri-building-2-line",     label: "학급 관리",  grants: ADMIN_GRANTS.CLASSES  },
  { to: ADMIN_ROUTES.NOTICES.LIST,  icon: "ri-megaphone-line",      label: "공지 관리",  grants: ADMIN_GRANTS.NOTICES  },
] as const;

const PARENT_QUICK_LINK_DEF = {
  to: ADMIN_ROUTES.PARENTS.LIST,
  icon: "ri-user-heart-line",
  label: "학부모 관리",
  grants: ADMIN_GRANTS.PARENTS,
};

export default function AdminHeader() {
  const { user } = useAuth();
  const grants: GrantInfo[] = user?.grants ?? [];
  const isSuperAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN';

  const navLinks = useMemo(() => {
    if (isSuperAdmin) return ALL_NAV_LINKS.map(({ grants: _, ...rest }) => rest);
    return ALL_NAV_LINKS
      .filter(item => hasGrant(grants, ...item.grants))
      .map(({ grants: _, ...rest }) => rest);
  }, [grants, isSuperAdmin]);

  const quickLink = useMemo(() => {
    if (!isSuperAdmin && !hasGrant(grants, ...PARENT_QUICK_LINK_DEF.grants)) return undefined;
    const { grants: _, ...link } = PARENT_QUICK_LINK_DEF;
    return link;
  }, [grants, isSuperAdmin]);

  return (
    <AdminTopBar
      position="sticky"
      navLinks={navLinks}
      quickLink={quickLink}
    />
  );
}

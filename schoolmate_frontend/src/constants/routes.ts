const ADMIN_BASE = '/admin';

export const ADMIN_ROUTES = {
  BASE: ADMIN_BASE,
  MAIN: ADMIN_BASE,
  SCHOOL_SELECT: `${ADMIN_BASE}/school-select`,
  DASHBOARD: `${ADMIN_BASE}/dashboard`,
  STUDENTS: {
    LIST: `${ADMIN_BASE}/students`,
    CREATE: `${ADMIN_BASE}/students/create`,
    DETAIL: (uid: string | number) => `${ADMIN_BASE}/students/${uid}`,
    DETAIL_PATTERN: `${ADMIN_BASE}/students/:uid`,
  },
  TEACHERS: {
    LIST: `${ADMIN_BASE}/teachers`,
    CREATE: `${ADMIN_BASE}/teachers/create`,
    DETAIL: (uid: string | number) => `${ADMIN_BASE}/teachers/${uid}`,
    DETAIL_PATTERN: `${ADMIN_BASE}/teachers/:uid`,
  },
  PARENTS: {
    LIST: `${ADMIN_BASE}/parents`,
    CREATE: `${ADMIN_BASE}/parents/create`,
    DETAIL: (id: string | number) => `${ADMIN_BASE}/parents/${id}`,
    DETAIL_PATTERN: `${ADMIN_BASE}/parents/:id`,
  },
  STAFFS: {
    LIST: `${ADMIN_BASE}/staffs`,
    CREATE: `${ADMIN_BASE}/staffs/create`,
    DETAIL: (uid: string | number) => `${ADMIN_BASE}/staffs/${uid}`,
    DETAIL_PATTERN: `${ADMIN_BASE}/staffs/:uid`,
  },
  CLASSES: {
    LIST: `${ADMIN_BASE}/classes`,
    CREATE: `${ADMIN_BASE}/classes/create`,
    DETAIL: (cid: string | number) => `${ADMIN_BASE}/classes/${cid}`,
    DETAIL_PATTERN: `${ADMIN_BASE}/classes/:cid`,
  },
  NOTICES: {
    LIST: `${ADMIN_BASE}/notices`,
    CREATE: `${ADMIN_BASE}/notices/create`,
    DETAIL: (id: string | number) => `${ADMIN_BASE}/notices/${id}`,
    DETAIL_PATTERN: `${ADMIN_BASE}/notices/:id`,
    EDIT: (id: string | number) => `${ADMIN_BASE}/notices/${id}/edit`,
    EDIT_PATTERN: `${ADMIN_BASE}/notices/:id/edit`,
  },
  FACILITIES: `${ADMIN_BASE}/facilities`,
  ASSETS: `${ADMIN_BASE}/assets`,
  DORMITORY: `${ADMIN_BASE}/dormitory`,
  MASTER: {
    SCHEDULE: `${ADMIN_BASE}/master/schedule`,
    SUBJECTS: `${ADMIN_BASE}/master/subjects`,
    SETTINGS: `${ADMIN_BASE}/master/settings`,
  },
  AUDIT: {
    ACCESS: `${ADMIN_BASE}/audit/access`,
    CHANGES: `${ADMIN_BASE}/audit/changes`,
  },
  SERVICE_NOTICES: {
    LIST: `${ADMIN_BASE}/service-notices`,
    CREATE: `${ADMIN_BASE}/service-notices/create`,
    DETAIL: (id: string | number) => `${ADMIN_BASE}/service-notices/${id}`,
    DETAIL_PATTERN: `${ADMIN_BASE}/service-notices/:id`,
    EDIT: (id: string | number) => `${ADMIN_BASE}/service-notices/${id}/edit`,
    EDIT_PATTERN: `${ADMIN_BASE}/service-notices/:id/edit`,
  },
};

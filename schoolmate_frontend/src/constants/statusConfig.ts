export interface StatusEntry {
  label: string
  badge: string
  btn: string
}

const DEFAULT: StatusEntry = {
  label: '-',
  badge: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
  btn: 'btn-secondary',
}

export const TEACHER_STATUS: Record<string, StatusEntry> = {
  PENDING:  { label: '승인대기', badge: 'bg-info-subtle text-info border border-info-subtle',          btn: 'btn-info'     },
  EMPLOYED: { label: '재직',     badge: 'bg-success-subtle text-success border border-success-subtle',  btn: 'btn-success'  },
  LEAVE:    { label: '휴직',     badge: 'bg-warning-subtle text-warning border border-warning-subtle',  btn: 'btn-warning'  },
  RETIRED:  { label: '퇴직',     badge: 'bg-danger-subtle text-danger border border-danger-subtle',     btn: 'btn-secondary'},
}

export const STAFF_STATUS: Record<string, StatusEntry> = {
  EMPLOYED:   { label: '재직',   badge: 'bg-success-subtle text-success border border-success-subtle',  btn: 'btn-success'  },
  LEAVE:      { label: '휴직',   badge: 'bg-warning-subtle text-warning border border-warning-subtle',  btn: 'btn-warning'  },
  DISPATCHED: { label: '파견',   badge: 'bg-info-subtle text-info border border-info-subtle',           btn: 'btn-info'     },
  SUSPENDED:  { label: '정직',   badge: 'bg-warning-subtle text-warning border border-warning-subtle',  btn: 'btn-warning'  },
  RETIRED:    { label: '퇴직',   badge: 'bg-danger-subtle text-danger border border-danger-subtle',     btn: 'btn-secondary'},
}

export const PARENT_STATUS: Record<string, StatusEntry> = {
  PENDING:  { label: '승인대기', badge: 'bg-info-subtle text-info border border-info-subtle',           btn: 'btn-info'     },
  ACTIVE:   { label: '활성',     badge: 'bg-success-subtle text-success border border-success-subtle',  btn: 'btn-success'  },
  INACTIVE: { label: '비활성',   badge: 'bg-secondary-subtle text-secondary border border-secondary-subtle', btn: 'btn-secondary' },
  BLOCKED:  { label: '차단',     badge: 'bg-danger-subtle text-danger border border-danger-subtle',     btn: 'btn-danger'   },
}

export const STUDENT_STATUS: Record<string, StatusEntry> = {
  PENDING:          { label: '승인대기', badge: 'bg-info',              btn: 'btn-info'     },
  ENROLLED:         { label: '재학',     badge: 'bg-success',           btn: 'btn-success'  },
  LEAVE_OF_ABSENCE: { label: '휴학',     badge: 'bg-warning text-dark', btn: 'btn-warning'  },
  DROPOUT:          { label: '자퇴',     badge: 'bg-secondary',         btn: 'btn-secondary'},
  EXPELLED:         { label: '제적',     badge: 'bg-danger',            btn: 'btn-danger'   },
  GRADUATED:        { label: '졸업',     badge: 'bg-primary',           btn: 'btn-primary'  },
  TRANSFERRED:      { label: '전학',     badge: 'bg-secondary',         btn: 'btn-secondary'},
}

export const EMPLOYMENT_TYPE: Record<string, { label: string; badge: string }> = {
  PERMANENT:           { label: '정규직',        badge: 'bg-primary-subtle text-primary border border-primary-subtle' },
  INDEFINITE_CONTRACT: { label: '무기계약직',    badge: 'bg-info-subtle text-info border border-info-subtle'          },
  FIXED_TERM:          { label: '기간제/계약직', badge: 'bg-info-subtle text-info border border-info-subtle'          },
  PART_TIME:           { label: '시간제/단기',   badge: 'bg-info-subtle text-info border border-info-subtle'          },
}

export const STATUS_DEFAULT = DEFAULT

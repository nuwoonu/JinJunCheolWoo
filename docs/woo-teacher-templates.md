# Woo Teacher 템플릿 참고 가이드

## temp 폴더 내 Teacher 관련 템플릿

**경로**: `src/main/resources/templates/temp/`

| 파일명 | 용도 | 활용 가능성 |
|--------|------|------------|
| `teacher-list.html` | 교사 목록 | 내 학급 학생 목록에 참고 |
| `teacher-details.html` | 교사 상세 정보 | 교사 프로필 페이지에 활용 |
| `teacher-attendance.html` | 교사 출석 관리 | 학생 출석 관리에 참고 |
| `teacher-timetable.html` | 교사 시간표 | 시간표 기능 구현 시 활용 |
| `add-new-teacher.html` | 교사 추가 폼 | - |
| `edit-teacher.html` | 교사 수정 폼 | - |

---

## Teacher 기능 구현에 참고할만한 다른 템플릿

| 파일명 | 용도 | 참고 포인트 |
|--------|------|------------|
| `student-list.html` | 학생 목록 | 테이블 구조, 검색/필터 UI |
| `student-details.html` | 학생 상세 | 상세 정보 레이아웃 |
| `student-attendance.html` | 학생 출석 | 출석 체크 UI (라디오 버튼) |
| `class-list.html` | 학급 목록 | 학급 관리 UI |
| `exam-schedule.html` | 시험 일정 | 일정/시간표 UI |

---

## Woo Teacher 작업 폴더 구조

```
templates/woo/teacher/
├── dashboard.html          ← 교사 대시보드
├── my-class-students.html  ← 내 학급 학생 목록
├── my-class-attendance.html← (추후) 출석 관리
├── timetable.html          ← (추후) 시간표
└── profile.html            ← (추후) 교사 프로필
```

---

## 컨트롤러 매핑

| 경로 | 컨트롤러 | 템플릿 |
|------|----------|--------|
| `/teacher/dashboard` | DashboardController | `woo/teacher/dashboard` |
| `/teacher/my-class/students` | TeacherClassController | `woo/teacher/my-class-students` |

---

## 구현 진행 상황

- [x] Step 1: 교사 대시보드에 담당 학급 정보 표시
- [x] Step 2: 내 학급 학생 목록 페이지
- [x] Step 3: 사이드바 메뉴 추가
- [ ] Step 4: 학생 출석 관리
- [ ] Step 5: 시간표 관리

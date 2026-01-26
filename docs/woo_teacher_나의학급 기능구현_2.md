# 게시판 시스템 구현 - 변경사항 문서

> 작성일: 2026-01-26

## 개요
통합 게시판 시스템을 구현했습니다. 하나의 Board 엔티티로 여러 종류의 게시판을 관리하며, 역할별 권한 체크를 포함합니다.

---

## 1. 변경된 파일 목록

### Java 파일

| 파일 경로 | 작업 | 설명 |
|-----------|------|------|
| `src/main/java/com/example/schoolmate/board/entity/BoardType.java` | 수정 | 게시판 타입 enum 확장 (6개 타입) |
| `src/main/java/com/example/schoolmate/board/entity/Board.java` | 신규 | 통합 게시판 엔티티 |
| `src/main/java/com/example/schoolmate/board/dto/BoardRequestDTO.java` | 신규 | 게시물 작성/수정 요청 DTO |
| `src/main/java/com/example/schoolmate/board/dto/BoardResponseDTO.java` | 신규 | 게시물 응답 DTO |
| `src/main/java/com/example/schoolmate/board/repository/BoardRepository.java` | 신규 | 게시판 Repository |
| `src/main/java/com/example/schoolmate/board/service/BoardService.java` | 신규 | 게시판 Service (권한 체크 포함) |
| `src/main/java/com/example/schoolmate/board/controller/BoardController.java` | 신규 | 게시판 뷰 컨트롤러 |
| `src/main/java/com/example/schoolmate/board/controller/BoardRestController.java` | 신규 | 게시판 REST API 컨트롤러 |
| `src/main/java/com/example/schoolmate/common/repository/StudentInfoRepository.java` | 수정 | `findByUserUid()` 메서드 추가 |

### 템플릿 파일

| 폴더 경로 | 파일 | 설명 |
|-----------|------|------|
| `templates/woo/teacher/board/school-notice/` | list.html, detail.html, write.html | 학교 공지 |
| `templates/woo/teacher/board/grade-board/` | list.html, detail.html, write.html | 학년 게시판 |
| `templates/woo/teacher/board/class-board/` | list.html, detail.html, write.html | 학급 게시판 |
| `templates/woo/teacher/board/teacher-board/` | list.html, detail.html, write.html | 교직원 게시판 |
| `templates/woo/teacher/board/parent-notice/` | list.html, detail.html, write.html | 학부모 공지 |
| `templates/woo/teacher/board/parent-board/` | list.html, detail.html, write.html | 학부모 게시판 |

---

## 2. 상세 변경 내용

### 2.1 BoardType enum 확장

**파일:** `src/main/java/com/example/schoolmate/board/entity/BoardType.java`

```java
public enum BoardType {
    // 학생/교사용
    SCHOOL_NOTICE,    // 학교 공지 (ADMIN 작성, 전체 열람)
    GRADE_BOARD,      // 학년 게시판 (교사 작성, 해당 학년 열람)
    CLASS_BOARD,      // 학급 게시판 (학생 작성, 해당 반 열람)
    TEACHER_BOARD,    // 교직원 게시판 (교사만)

    // 학부모용
    PARENT_NOTICE,    // 학부모 공지 (교사 작성, 학부모 열람)
    PARENT_BOARD,     // 학부모 게시판 (학부모 작성)

    // 기존 호환용 (deprecated)
    @Deprecated
    BOARD,
    @Deprecated
    NOTICE
}
```

### 2.2 Board 엔티티

**파일:** `src/main/java/com/example/schoolmate/board/entity/Board.java`

```java
@Entity
@Table(name = "board", indexes = {
    @Index(name = "idx_board_type", columnList = "board_type"),
    @Index(name = "idx_board_type_grade", columnList = "board_type, target_grade"),
    @Index(name = "idx_board_type_classroom", columnList = "board_type, target_classroom_id")
})
public class Board extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "board_type", nullable = false)
    private BoardType boardType;

    private String title;
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_id", nullable = false)
    private User writer;

    // 학년 게시판용 (null이면 전체 대상)
    @Column(name = "target_grade")
    private Integer targetGrade;

    // 학급 게시판용 (null이면 학년 전체 또는 전체 대상)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_classroom_id")
    private Classroom targetClassroom;

    private int viewCount = 0;
    private boolean isPinned = false;
    private boolean isDeleted = false;
}
```

### 2.3 권한 체크 로직 (BoardService)

**파일:** `src/main/java/com/example/schoolmate/board/service/BoardService.java`

#### 작성 권한

| 게시판 | 작성 권한 |
|--------|----------|
| 학교 공지 (SCHOOL_NOTICE) | ADMIN만 |
| 학년 게시판 (GRADE_BOARD) | 교사 |
| 학급 게시판 (CLASS_BOARD) | 해당 반 학생 |
| 교직원 게시판 (TEACHER_BOARD) | 교사 |
| 학부모 공지 (PARENT_NOTICE) | 교사 |
| 학부모 게시판 (PARENT_BOARD) | 학부모 |

#### 열람 권한

| 게시판 | 열람 권한 |
|--------|----------|
| 학교 공지 | 전체 |
| 학년 게시판 | 해당 학년 학생 + 교사 |
| 학급 게시판 | 해당 반 학생 + 담임 |
| 교직원 게시판 | 교사만 |
| 학부모 공지 | 학부모 + 교사 |
| 학부모 게시판 | 학부모 + 교사 |

#### ADMIN 특권

- **ADMIN은 모든 게시판 열람/작성/수정/삭제 가능**

### 2.4 URL 라우팅 (BoardController)

**파일:** `src/main/java/com/example/schoolmate/board/controller/BoardController.java`

| URL | 메서드 | 설명 |
|-----|--------|------|
| `/board/school-notice` | GET | 학교 공지 목록 |
| `/board/school-notice/{id}` | GET | 학교 공지 상세 |
| `/board/school-notice/write` | GET | 학교 공지 작성 폼 |
| `/board/grade/{grade}` | GET | 학년 게시판 목록 |
| `/board/grade/{grade}/{id}` | GET | 학년 게시판 상세 |
| `/board/grade/{grade}/write` | GET | 학년 게시판 작성 폼 |
| `/board/class/{grade}/{classNum}` | GET | 학급 게시판 목록 |
| `/board/class/{grade}/{classNum}/{id}` | GET | 학급 게시판 상세 |
| `/board/class/{grade}/{classNum}/write` | GET | 학급 게시판 작성 폼 |
| `/board/teacher` | GET | 교직원 게시판 목록 |
| `/board/teacher/{id}` | GET | 교직원 게시판 상세 |
| `/board/teacher/write` | GET | 교직원 게시판 작성 폼 |
| `/board/parent-notice` | GET | 학부모 공지 목록 (전체) |
| `/board/parent-notice/grade/{grade}` | GET | 학부모 공지 목록 (학년별) |
| `/board/parent-notice/{id}` | GET | 학부모 공지 상세 |
| `/board/parent-notice/write` | GET | 학부모 공지 작성 폼 |
| `/board/parent` | GET | 학부모 게시판 목록 (전체) |
| `/board/parent/grade/{grade}` | GET | 학부모 게시판 목록 (학년별) |
| `/board/parent/{id}` | GET | 학부모 게시판 상세 |
| `/board/parent/write` | GET | 학부모 게시판 작성 폼 |

### 2.5 REST API (BoardRestController)

**파일:** `src/main/java/com/example/schoolmate/board/controller/BoardRestController.java`

| URL | Method | 설명 |
|-----|--------|------|
| `/api/board` | POST | 게시물 작성 |
| `/api/board/{id}` | PUT | 게시물 수정 |
| `/api/board/{id}` | DELETE | 게시물 삭제 |
| `/api/board/{id}/pin` | POST | 상단 고정 토글 (ADMIN만) |

---

## 3. 데이터 흐름

```
[사용자 요청]
    ↓
[BoardController - URL 매핑]
    ↓
[BoardService - 권한 체크]
    ├── isAdmin() → 모든 권한 허용
    ├── isTeacher() / isStudent() / isParent() 체크
    └── 해당 학년/학급 소속 여부 확인
    ↓
[BoardRepository - 데이터 조회]
    ↓
[BoardResponseDTO 변환]
    ↓
[템플릿 렌더링]
```

---

## 4. 게시판 구조도

```
📌 게시판 전체 구조
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏫 학교 공지사항 ──────────────── 전체 대상
   └─ /board/school-notice

📚 학년 게시판 (학생/교사용)
   ├─ 1학년 게시판 ─────────────── /board/grade/1
   ├─ 2학년 게시판 ─────────────── /board/grade/2
   └─ 3학년 게시판 ─────────────── /board/grade/3

🏫 학급 게시판 (학생/교사용)
   └─ 3학년 2반 ────────────────── /board/class/3/2?classroomId=xxx

👨‍🏫 교직원 게시판 ─────────────── /board/teacher

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍👩‍👧 학부모 공지 (교사 → 학부모)
   ├─ 전체 공지 ────────────────── /board/parent-notice
   ├─ 1학년 학부모 공지 ────────── /board/parent-notice/grade/1
   ├─ 2학년 학부모 공지 ────────── /board/parent-notice/grade/2
   └─ 3학년 학부모 공지 ────────── /board/parent-notice/grade/3

👨‍👩‍👧 학부모 게시판 (학부모 작성)
   ├─ 전체 ─────────────────────── /board/parent
   ├─ 1학년 학부모 게시판 ──────── /board/parent/grade/1
   ├─ 2학년 학부모 게시판 ──────── /board/parent/grade/2
   └─ 3학년 학부모 게시판 ──────── /board/parent/grade/3
```

---

## 5. 템플릿 구조

```
templates/woo/teacher/board/
├── school-notice/
│   ├── list.html      # 목록 (페이지네이션)
│   ├── detail.html    # 상세 (조회수 증가)
│   └── write.html     # 작성 폼
├── grade-board/
│   ├── list.html      # 학년 탭 포함
│   ├── detail.html
│   └── write.html
├── class-board/
│   ├── list.html
│   ├── detail.html
│   └── write.html
├── teacher-board/
│   ├── list.html
│   ├── detail.html
│   └── write.html
├── parent-notice/
│   ├── list.html      # 학년 탭 포함
│   ├── detail.html
│   └── write.html     # 대상 선택 (전체/학년)
└── parent-board/
    ├── list.html      # 학년 탭 포함
    ├── detail.html
    └── write.html     # 대상 선택 (전체/학년)
```

---

## 6. 주요 기능

### 6.1 상단 고정 (isPinned)
- ADMIN만 상단 고정 설정 가능
- 고정된 게시물은 목록 상단에 표시
- 배경색으로 구분 (`bg-primary-50`)

### 6.2 Soft Delete
- 게시물 삭제 시 `isDeleted = true`로 설정
- 실제 DB에서 삭제하지 않음
- 조회 시 `isDeleted = false` 조건 적용

### 6.3 조회수
- 상세 페이지 접근 시 자동 증가
- `@Transactional`로 처리

### 6.4 페이지네이션
- 기본 10개씩 표시
- Spring Data의 `Pageable` 사용

---

## 7. StudentInfoRepository 수정

**파일:** `src/main/java/com/example/schoolmate/common/repository/StudentInfoRepository.java`

**추가된 메서드:**
```java
// [woo] User UID로 학생 정보 조회 - 게시판 권한 체크 시 학생의 학급 정보 확인용
@Query("SELECT s FROM StudentInfo s WHERE s.user.uid = :uid")
Optional<StudentInfo> findByUserUid(@Param("uid") Long uid);
```

---

## 8. 사이드바 메뉴 변경

**파일:** `src/main/resources/templates/fragments/sidebar.html`

**추가된 메뉴:**

```html
<!-- [woo] 공지사항 - 전체 -->
<li class="dropdown" sec:authorize="isAuthenticated()">
  <a href="javascript:void(0)">
    <i class="ri-megaphone-line"></i>
    <span>공지사항</span>
  </a>
  <ul class="sidebar-submenu">
    <li>
      <a th:href="@{/board/school-notice}">학교 공지</a>
    </li>
  </ul>
</li>

<!-- [woo] 게시판 - 학생/교사/ADMIN -->
<li class="dropdown" sec:authorize="hasAnyRole('STUDENT', 'TEACHER', 'ADMIN')">
  <a href="javascript:void(0)">
    <i class="ri-article-line"></i>
    <span>게시판</span>
  </a>
  <ul class="sidebar-submenu">
    <li>학년 게시판 → /board/grade/1</li>
    <li>우리 반 게시판 (학생/교사/ADMIN)</li>
    <li>교직원 게시판 (교사/ADMIN만) → /board/teacher</li>
  </ul>
</li>

<!-- [woo] 학부모 게시판 - 학부모/교사/ADMIN -->
<li class="dropdown" sec:authorize="hasAnyRole('PARENT', 'TEACHER', 'ADMIN')">
  <a href="javascript:void(0)">
    <i class="ri-parent-line"></i>
    <span>학부모 게시판</span>
  </a>
  <ul class="sidebar-submenu">
    <li>학부모 공지 → /board/parent-notice</li>
    <li>학부모 게시판 → /board/parent</li>
  </ul>
</li>
```

---

## 9. 향후 개선 사항

- [x] 사이드바에 게시판 메뉴 추가
- [ ] 학급 게시판 접근 시 classroomId 자동 조회 로직 추가 (현재 하드코딩)
- [ ] 우리 반 게시판 링크를 로그인 사용자 학급 기반으로 동적 생성
- [ ] 게시물 수정 기능 UI 구현
- [ ] 파일 첨부 기능
- [ ] 댓글 기능
- [ ] 검색 기능 UI
- [ ] 학부모 게시판 학급별 필터링

---

## 9. 테스트 방법

1. 애플리케이션 실행
2. 각 역할별 계정으로 로그인
   - ADMIN: 모든 게시판 접근/작성 가능
   - TEACHER: 학교 공지 열람, 학년/교직원/학부모공지 작성 가능
   - STUDENT: 본인 학년/학급 게시판 접근, 학급 게시판 작성 가능
   - PARENT: 학부모 공지 열람, 학부모 게시판 작성 가능
3. URL 직접 접근하여 테스트
   - `/board/school-notice`
   - `/board/grade/1`
   - `/board/teacher`
   - `/board/parent-notice`

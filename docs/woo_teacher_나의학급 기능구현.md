# 교사 사이드바 재구성 - 변경사항 문서

> 작성일: 2026-01-26

## 개요
교사(TEACHER) 역할 사용자를 위한 사이드바 네비게이션을 재구성하고, "나의 학급" 기능을 추가했습니다.

---

## 1. 변경된 파일 목록

| 파일 경로 | 작업 | 설명 |
|-----------|------|------|
| `src/main/resources/templates/fragments/sidebar.html` | 수정 | "나의 학급" 메뉴 추가, 선생님 메뉴 정리 |
| `src/main/java/com/example/schoolmate/woo/controller/TeacherViewController.java` | 신규 | 교사 뷰 컨트롤러 |
| `src/main/java/com/example/schoolmate/common/repository/TeacherInfoRepository.java` | 수정 | `findByUserUid()` 메서드 추가 |
| `src/main/resources/templates/teacher/myclass/index.html` | 신규 | 학급 현황 페이지 템플릿 |
| `src/main/resources/templates/teacher/myclass/students.html` | 신규 | 학생 관리 페이지 템플릿 |
| `src/main/resources/templates/teacher/teacher-list.html` | 수정 | ADMIN 권한 체크 추가 |
| `src/main/resources/templates/dashboard/teacher.html` | 수정 | 프로필/차트 제거, 학급 카드 추가 |
| `src/main/java/com/example/schoolmate/controller/DashboardController.java` | 수정 | 교사 대시보드에 classInfo 전달 |

---

## 2. 상세 변경 내용

### 2.1 사이드바 (sidebar.html)

**추가된 메뉴:**
```html
<!-- 나의 학급 - TEACHER만 -->
<li class="dropdown" sec:authorize="hasRole('TEACHER')">
  <a href="javascript:void(0)">
    <i class="ri-team-line"></i>
    <span>나의 학급</span>
  </a>
  <ul class="sidebar-submenu">
    <li>
      <a th:href="@{/teacher/myclass}">학급 현황</a>
    </li>
    <li>
      <a th:href="@{/teacher/myclass/students}">학생 관리</a>
    </li>
  </ul>
</li>
```

**선생님 메뉴 변경:**
- 기존: 선생님 목록, 수정, 자세히
- 변경 후: **선생님 목록만 유지** (수정, 자세히 제거)

### 2.2 TeacherViewController.java (신규 생성)

**위치:** `src/main/java/com/example/schoolmate/woo/controller/TeacherViewController.java`

**라우트 맵핑:**

| URL | 메서드 | 접근 권한 | 설명 |
|-----|--------|-----------|------|
| `/teacher/list` | `teacherList()` | TEACHER, ADMIN | 선생님 목록 페이지 |
| `/teacher/myclass` | `myClassPage()` | TEACHER | 학급 현황 페이지 |
| `/teacher/myclass/students` | `studentsPage()` | TEACHER | 학생 관리 페이지 |

**주요 기능:**
- 로그인한 교사의 User ID → TeacherInfo ID 변환
- TeacherService를 통해 담당 학급 정보 조회
- 담당 학급이 없는 경우 에러 메시지 표시

### 2.3 TeacherInfoRepository.java (수정)

**추가된 메서드:**
```java
// User ID로 교사 정보 조회
Optional<TeacherInfo> findByUserUid(Long uid);
```

### 2.4 학급 현황 페이지 (myclass/index.html)

**경로:** `src/main/resources/templates/teacher/myclass/index.html`

**표시 내용:**
- 학급 정보 카드 (학년도, 학년, 반, 학급명)
- 담임 교사 카드
- 학생 수 카드 (학생 관리 바로가기 버튼)
- 학생 목록 미리보기 (상위 5명)

**사용 데이터:**
- `classInfo` (ClassStudentDTO)
  - `year` - 학년도
  - `grade` - 학년
  - `classNum` - 반
  - `className` - 학급명
  - `homeroomTeacherName` - 담임 이름
  - `totalStudents` - 총 학생 수
  - `students` - 학생 목록

### 2.5 학생 관리 페이지 (myclass/students.html)

**경로:** `src/main/resources/templates/teacher/myclass/students.html`

**표시 내용:**
- 학급 정보 헤더
- 학생 목록 테이블 (DataTable 적용)
  - 번호, 이름, 연락처, 이메일, 상세 보기 버튼
- 학생 상세 모달

**사용 기술:**
- DataTable (검색, 정렬, 페이지네이션)
- Bootstrap Modal

---

## 3. 데이터 흐름

```
[교사 로그인]
    ↓
[사이드바: 나의 학급 클릭]
    ↓
[TeacherViewController.myClassPage()]
    ↓
[AuthUserDTO → User UID 추출]
    ↓
[TeacherInfoRepository.findByUserUid(uid)]
    ↓
[TeacherInfo.getId() → teacherId]
    ↓
[TeacherService.getMyClassStudents(teacherId, year)]
    ↓
[ClassroomRepository.findByHomeroomTeacherIdAndYear()]
    ↓
[ClassStudentDTO 반환]
    ↓
[템플릿 렌더링]
```

---

## 4. 연관 기존 코드

### TeacherService (기존)
- `getMyClassStudents(Long teacherId, int year)` - 담당 학급 학생 조회
- `getClassStudents(int year, int grade, int classNum)` - 특정 학급 학생 조회

### ClassStudentDTO (기존)
```java
public class ClassStudentDTO {
    private Long classroomId;
    private int year;
    private int grade;
    private int classNum;
    private String className;
    private int totalStudents;
    private String homeroomTeacherName;
    private List<StudentSimpleDTO> students;

    public static class StudentSimpleDTO {
        private Long studentId;
        private String name;
        private Long studentNumber;
        private String phone;
        private String email;
    }
}
```

---

## 5. 주의사항

### 5.1 담당 학급 필요
- 교사가 담당 학급을 배정받아야 "나의 학급" 기능 사용 가능
- `Classroom.homeroomTeacher`에 TeacherInfo가 연결되어야 함
- 담당 학급이 없으면 "담당 학급이 없습니다" 메시지 표시

### 5.2 Thymeleaf + JavaScript 주의
- `[[...]]` 형태의 JavaScript 배열은 Thymeleaf 인라인 표현식으로 오해석됨
- `<script th:inline="none">` 추가하여 해결

---

## 6. 테스트 방법

1. 애플리케이션 실행
2. **교사 계정**으로 로그인
3. 사이드바에서 "나의 학급" 메뉴 확인
4. "학급 현황" 클릭 → 학급 정보 표시 확인
5. "학생 관리" 클릭 → 학생 목록 표시 확인
6. "선생님 목록" 클릭 → 교사 목록 표시 확인

---

## 7. 추가 변경사항 (2026-01-26 이후)

### 7.1 교사 목록 페이지 - ADMIN 권한 제한

**파일:** `src/main/resources/templates/teacher/teacher-list.html`

**변경 내용:**
ADMIN 역할만 교사 추가/수정 기능 사용 가능하도록 수정

```html
<!-- 교사 추가 버튼 - ADMIN만 -->
<button type="button" class="my-sidebar-btn btn btn-primary-600"
        sec:authorize="hasRole('ADMIN')">
  교사 추가
</button>

<!-- 관리 컬럼 헤더 - ADMIN만 -->
<th scope="col" sec:authorize="hasRole('ADMIN')">관리</th>

<!-- 수정 버튼 - ADMIN만 -->
<td sec:authorize="hasRole('ADMIN')">
  <button type="button" class="edit-sidebar-btn btn btn-sm btn-outline-primary-600">
    수정
  </button>
</td>

<!-- Add sidebar, Edit sidebar - ADMIN만 -->
<div sec:authorize="hasRole('ADMIN')" class="my-sidebar ...">
<div sec:authorize="hasRole('ADMIN')" class="edit-sidebar ...">
```

### 7.2 교사 대시보드 학급 현황 카드 추가

**변경 파일:**

| 파일 경로 | 작업 | 설명 |
|-----------|------|------|
| `src/main/resources/templates/dashboard/teacher.html` | 수정 | 프로필/차트 제거, 학급 카드 추가 |
| `src/main/java/com/example/schoolmate/controller/DashboardController.java` | 수정 | classInfo 전달 로직 추가 |

#### 7.2.1 teacher.html 변경

**제거된 항목:**
- 교사 프로필 카드
- 차트 (ApexCharts)
- ApexCharts CSS/JS 의존성

**추가된 항목 - 나의 학급 현황 카드:**
```html
<!-- 나의 학급 현황 카드 -->
<div class="col-xxl-4 col-lg-6">
  <div class="card radius-12 h-100">
    <div class="card-header">
      <h6>나의 학급</h6>
      <a th:href="@{/teacher/myclass/students}">학생 관리</a>
    </div>

    <!-- 학급 있을 때 -->
    <div class="card-body" th:if="${classInfo != null}">
      <h5 th:text="${classInfo.grade} + '학년 ' + ${classInfo.classNum} + '반'">3학년 2반</h5>
      <span th:text="${classInfo.year} + '학년도'">2026학년도</span>
      <span th:text="${classInfo.totalStudents} + '명'">30명</span>
    </div>

    <!-- 학급 없을 때 -->
    <div class="card-body" th:if="${classInfo == null}">
      <p>담당 학급이 없습니다</p>
    </div>
  </div>
</div>
```

#### 7.2.2 DashboardController.java 변경

**추가된 import:**
```java
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.service.TeacherService;
```

**추가된 필드:**
```java
private final TeacherService teacherService;
private final TeacherInfoRepository teacherInfoRepository;
```

**수정된 메서드:**
```java
@GetMapping("/teacher/dashboard")
public String getTeacherDashboard(@AuthenticationPrincipal AuthUserDTO authUserDTO, Model model) {
    Long uid = authUserDTO.getCustomUserDTO().getUid();
    int currentYear = LocalDate.now().getYear();

    // 교사 정보 조회 후 학급 정보 가져오기
    TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(uid).orElse(null);
    if (teacherInfo != null) {
        try {
            ClassStudentDTO classInfo = teacherService.getMyClassStudents(teacherInfo.getId(), currentYear);
            model.addAttribute("classInfo", classInfo);
        } catch (Exception e) {
            model.addAttribute("classInfo", null);
        }
    } else {
        model.addAttribute("classInfo", null);
    }

    return "dashboard/teacher";
}
```

---

## 8. 향후 개선 가능 사항

- [ ] 학생 상세 정보 수정 기능
- [ ] 출결 관리 연동
- [ ] 성적 입력 페이지 연결
- [ ] 학부모 연락처 표시
- [ ] 대시보드에 출결 현황 위젯 추가
- [ ] 대시보드에 최근 공지사항 표시

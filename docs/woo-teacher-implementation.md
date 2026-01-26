# woo 폴더 - Teacher 역할 구현 가이드

## 개요

cheol 폴더가 Student 역할을 담당하듯이, woo 폴더는 Teacher 역할을 담당함.
두 폴더가 연동되어 교사-학생 관계 기능을 완성함.

---

## cheol 폴더 구조 (참고용)

```
cheol/
├── controller/
│   └── GradeController.java      # 성적 API (조회)
├── dto/
│   ├── GradeDTO.java
│   ├── SubjectDTO.java
│   └── studentdto/
│       ├── StudentCreateDTO.java
│       ├── StudentResponseDTO.java
│       └── StudentUpdateDTO.java
├── entity/
│   ├── Grade.java                # 성적 엔티티
│   ├── Subject.java              # 과목 엔티티 (→ TeacherInfo 연결됨)
│   └── Enrollment.java           # 수강신청 엔티티
├── repository/
│   ├── GradeRepository.java
│   └── SubjectRepository.java
└── service/
    ├── GradeService.java         # 성적 조회 서비스
    └── StudentServiceImpl.java   # 학생 CRUD 서비스
```

---

## woo 폴더 구조 (만들어야 할 것)

```
woo/
├── controller/
│   ├── TeacherController.java       # 교사 정보 API
│   ├── TeacherGradeController.java  # 교사가 성적 입력/수정하는 API
│   └── TeacherClassController.java  # 담당 학급 관리 API
├── dto/
│   ├── teacherdto/
│   │   ├── TeacherCreateDTO.java
│   │   ├── TeacherResponseDTO.java
│   │   └── TeacherUpdateDTO.java
│   ├── GradeInputDTO.java           # 성적 입력용 DTO
│   └── ClassStudentDTO.java         # 반 학생 목록 DTO
├── repository/
│   └── TeacherInfoRepository.java   # (common에 있으면 그거 사용)
└── service/
    ├── TeacherService.java          # 인터페이스
    └── TeacherServiceImpl.java      # 구현체
```

---

## 1. DTO 만들기

### 1-1. TeacherCreateDTO.java

```java
package com.example.schoolmate.woo.dto.teacherdto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 교사 등록할 때 필요한 정보들
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherCreateDTO {

    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    @NotBlank(message = "이메일은 필수입니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;

    // 담당 과목 (국어, 수학 등)
    private String subject;

    // 소속 부서 (교무부, 연구부 등)
    private String department;

    // 직책 (부장, 평교사 등)
    private String position;
}
```

### 1-2. TeacherResponseDTO.java

```java
package com.example.schoolmate.woo.dto.teacherdto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 교사 정보 응답용 DTO
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherResponseDTO {

    private Long id;

    private String name;

    private String email;

    // 담당 과목
    private String subject;

    // 소속 부서
    private String department;

    // 직책
    private String position;

    // 재직 상태
    private TeacherStatus status;

    // 담당 학급 정보 (있으면)
    private String homeroomClass;  // "3학년 2반" 이런 식으로

    // 담당 학생 수
    private int studentCount;

    private LocalDateTime createdDate;

    private LocalDateTime modifiedDate;

    // Entity -> DTO 변환
    public TeacherResponseDTO(TeacherInfo teacher) {
        this.id = teacher.getId();
        this.subject = teacher.getSubject();
        this.department = teacher.getDepartment();
        this.position = teacher.getPosition();
        this.status = teacher.getStatus();

        // User 정보가 있으면 가져옴
        if (teacher.getUser() != null) {
            this.name = teacher.getUser().getName();
            this.email = teacher.getUser().getEmail();
        }

        // 담당 학생 수
        this.studentCount = teacher.getTeacherStudents() != null
            ? teacher.getTeacherStudents().size()
            : 0;
    }
}
```

### 1-3. TeacherUpdateDTO.java

```java
package com.example.schoolmate.woo.dto.teacherdto;

import com.example.schoolmate.common.entity.info.constant.TeacherStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 교사 정보 수정용 DTO
// null이면 수정 안함
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherUpdateDTO {

    private String subject;

    private String department;

    private String position;

    private TeacherStatus status;
}
```

### 1-4. GradeInputDTO.java (성적 입력용)

```java
package com.example.schoolmate.woo.dto;

import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.example.schoolmate.common.entity.user.constant.Year;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 교사가 학생 성적 입력할 때 쓰는 DTO
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeInputDTO {

    @NotNull(message = "학생 ID는 필수입니다.")
    private Long studentId;

    @NotNull(message = "과목 코드는 필수입니다.")
    private String subjectCode;

    @NotNull(message = "시험 종류는 필수입니다.")
    private TestType testType;  // 중간고사, 기말고사 등

    @NotNull(message = "학기는 필수입니다.")
    private Semester semester;

    @NotNull(message = "학년은 필수입니다.")
    private Year year;

    @NotNull(message = "점수는 필수입니다.")
    @Min(value = 0, message = "점수는 0점 이상이어야 합니다.")
    @Max(value = 100, message = "점수는 100점 이하여야 합니다.")
    private Double score;
}
```

### 1-5. ClassStudentDTO.java (반 학생 목록용)

```java
package com.example.schoolmate.woo.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 담당 반 학생 목록 조회용 DTO
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassStudentDTO {

    private Long classroomId;

    private int year;       // 학년도

    private int grade;      // 학년

    private int classNum;   // 반

    private String className;  // "2025학년도 3학년 2반"

    private int totalStudents;

    // 학생 목록
    private List<StudentSimpleDTO> students;

    // 학생 간단 정보
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentSimpleDTO {
        private Long studentId;
        private String name;
        private int number;        // 번호
        private String phone;
    }
}
```

---

## 2. Service 만들기

### 2-1. TeacherService.java (인터페이스)

```java
package com.example.schoolmate.woo.service;

import java.util.List;

import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherCreateDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherResponseDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherUpdateDTO;

public interface TeacherService {

    // ========== 교사 CRUD ==========
    TeacherResponseDTO createTeacher(TeacherCreateDTO createDTO);

    TeacherResponseDTO getTeacherById(Long id);

    List<TeacherResponseDTO> getAllTeachers();

    TeacherResponseDTO updateTeacher(Long id, TeacherUpdateDTO updateDTO);

    void deleteTeacher(Long id);

    // ========== 담당 학급 관련 ==========
    // 내 담당 반 학생들 조회
    ClassStudentDTO getMyClassStudents(Long teacherId, int schoolYear);

    // 특정 학급 학생들 조회 (학년, 반으로)
    ClassStudentDTO getClassStudents(int schoolYear, int grade, int classNum);

    // ========== 성적 입력 (cheol 연동) ==========
    // 성적 입력
    void inputGrade(Long teacherId, GradeInputDTO gradeDTO);

    // 성적 수정
    void updateGrade(Long teacherId, Long gradeId, Double newScore);

    // 내 과목 학생들 성적 조회
    List<?> getMySubjectGrades(Long teacherId, int semester, int year);
}
```

### 2-2. TeacherServiceImpl.java (구현체)

```java
package com.example.schoolmate.woo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.parkjoon.entity.Classroom;
import com.example.schoolmate.parkjoon.repository.ClassroomRepository;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherCreateDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherResponseDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherUpdateDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class TeacherServiceImpl implements TeacherService {

    // 공통 Repository
    private final TeacherInfoRepository teacherRepository;
    private final StudentInfoRepository studentRepository;
    private final ClassroomRepository classroomRepository;

    // cheol 폴더 Repository (연동)
    private final GradeRepository gradeRepository;
    private final SubjectRepository subjectRepository;

    // ========== 교사 CRUD ==========

    @Override
    @Transactional
    public TeacherResponseDTO createTeacher(TeacherCreateDTO createDTO) {
        log.info("교사 등록: {}", createDTO.getName());

        TeacherInfo teacher = new TeacherInfo();
        teacher.setSubject(createDTO.getSubject());
        teacher.setDepartment(createDTO.getDepartment());
        teacher.setPosition(createDTO.getPosition());
        teacher.setStatus(TeacherStatus.EMPLOYED);

        // User 생성 로직은 별도로 처리해야 함 (회원가입 연동)
        // 여기서는 TeacherInfo만 생성

        TeacherInfo saved = teacherRepository.save(teacher);
        return new TeacherResponseDTO(saved);
    }

    @Override
    public TeacherResponseDTO getTeacherById(Long id) {
        TeacherInfo teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));
        return new TeacherResponseDTO(teacher);
    }

    @Override
    public List<TeacherResponseDTO> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(TeacherResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TeacherResponseDTO updateTeacher(Long id, TeacherUpdateDTO updateDTO) {
        TeacherInfo teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));

        // null 체크해서 있는 것만 업데이트 (Dirty Checking)
        if (updateDTO.getSubject() != null) {
            teacher.setSubject(updateDTO.getSubject());
        }
        if (updateDTO.getDepartment() != null) {
            teacher.setDepartment(updateDTO.getDepartment());
        }
        if (updateDTO.getPosition() != null) {
            teacher.setPosition(updateDTO.getPosition());
        }
        if (updateDTO.getStatus() != null) {
            teacher.setStatus(updateDTO.getStatus());
        }

        return new TeacherResponseDTO(teacher);
    }

    @Override
    @Transactional
    public void deleteTeacher(Long id) {
        TeacherInfo teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));

        // 소프트 삭제 (퇴직 처리)
        teacher.setStatus(TeacherStatus.RESIGNED);
    }

    // ========== 담당 학급 관련 ==========

    @Override
    public ClassStudentDTO getMyClassStudents(Long teacherId, int schoolYear) {
        log.info("담당 반 학생 조회 - 교사 ID: {}, 학년도: {}", teacherId, schoolYear);

        // 교사가 담임인 학급 찾기
        // Classroom에 homeroomTeacher 필드가 있어야 함 (teacher-student-connection.md 참고)
        Classroom classroom = classroomRepository.findByHomeroomTeacherIdAndYear(teacherId, schoolYear)
                .orElseThrow(() -> new IllegalArgumentException("담당 학급이 없습니다."));

        return buildClassStudentDTO(classroom);
    }

    @Override
    public ClassStudentDTO getClassStudents(int schoolYear, int grade, int classNum) {
        log.info("학급 학생 조회 - {}학년도 {}학년 {}반", schoolYear, grade, classNum);

        Classroom classroom = classroomRepository.findByYearAndGradeAndClassNum(schoolYear, grade, classNum)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));

        return buildClassStudentDTO(classroom);
    }

    // 학급 DTO 만드는 헬퍼 메서드
    private ClassStudentDTO buildClassStudentDTO(Classroom classroom) {
        // 해당 학급 학생들 조회
        List<StudentInfo> students = studentRepository.findByClassroomCid(classroom.getCid());

        List<ClassStudentDTO.StudentSimpleDTO> studentDTOs = students.stream()
                .map(s -> ClassStudentDTO.StudentSimpleDTO.builder()
                        .studentId(s.getId())
                        .name(s.getUser() != null ? s.getUser().getName() : "이름없음")
                        .number(s.getStudentNumber().intValue())
                        .phone(s.getPhone())
                        .build())
                .collect(Collectors.toList());

        return ClassStudentDTO.builder()
                .classroomId(classroom.getCid())
                .year(classroom.getYear())
                .grade(classroom.getGrade())
                .classNum(classroom.getClassNum())
                .className(classroom.getYear() + "학년도 " + classroom.getGrade() + "학년 " + classroom.getClassNum() + "반")
                .totalStudents(students.size())
                .students(studentDTOs)
                .build();
    }

    // ========== 성적 입력 (cheol 연동) ==========

    @Override
    @Transactional
    public void inputGrade(Long teacherId, GradeInputDTO gradeDTO) {
        log.info("성적 입력 - 교사: {}, 학생: {}, 과목: {}",
                teacherId, gradeDTO.getStudentId(), gradeDTO.getSubjectCode());

        // 1. 교사 확인
        TeacherInfo teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));

        // 2. 과목 확인 (내 담당 과목인지)
        Subject subject = subjectRepository.findByCode(gradeDTO.getSubjectCode())
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다."));

        // 담당 교사 확인 (선택적 - 다른 과목 입력 막으려면)
        if (subject.getTeacher() != null && !subject.getTeacher().getId().equals(teacherId)) {
            throw new IllegalArgumentException("담당 과목이 아닙니다.");
        }

        // 3. 학생 확인
        StudentInfo student = studentRepository.findById(gradeDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        // 4. 성적 생성 (cheol의 Grade 엔티티 사용)
        Grade grade = Grade.builder()
                .student(student)
                .subject(subject)
                .testType(gradeDTO.getTestType())
                .semester(gradeDTO.getSemester())
                .year(gradeDTO.getYear())
                .score(gradeDTO.getScore())
                .build();

        gradeRepository.save(grade);
        log.info("성적 입력 완료 - 학생: {}, 과목: {}, 점수: {}",
                student.getId(), subject.getName(), gradeDTO.getScore());
    }

    @Override
    @Transactional
    public void updateGrade(Long teacherId, Long gradeId, Double newScore) {
        log.info("성적 수정 - 교사: {}, 성적ID: {}, 새점수: {}", teacherId, gradeId, newScore);

        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적을 찾을 수 없습니다."));

        // 담당 과목 확인 (선택적)
        Subject subject = grade.getSubject();
        if (subject.getTeacher() != null && !subject.getTeacher().getId().equals(teacherId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        // 점수 수정 (Dirty Checking)
        grade.changeScore(newScore);
    }

    @Override
    public List<?> getMySubjectGrades(Long teacherId, int semester, int year) {
        log.info("내 과목 성적 조회 - 교사: {}", teacherId);

        // 내가 담당하는 과목들
        List<Subject> mySubjects = subjectRepository.findByTeacherId(teacherId);

        if (mySubjects.isEmpty()) {
            return List.of();
        }

        // 해당 과목들의 성적 조회
        // 여기서는 간단히 첫 번째 과목 기준으로 조회
        // 실제로는 여러 과목 한번에 조회하는 쿼리 필요
        String subjectCode = mySubjects.get(0).getCode();
        return gradeRepository.findBySubjectCodeWithSubject(subjectCode);
    }
}
```

---

## 3. Controller 만들기

### 3-1. TeacherController.java

```java
package com.example.schoolmate.woo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.woo.dto.teacherdto.TeacherCreateDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherResponseDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherUpdateDTO;
import com.example.schoolmate.woo.service.TeacherService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

// 교사 정보 CRUD API
@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    // 교사 등록
    // POST /api/teachers
    @PostMapping
    public ResponseEntity<TeacherResponseDTO> createTeacher(
            @Valid @RequestBody TeacherCreateDTO createDTO) {
        TeacherResponseDTO response = teacherService.createTeacher(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 교사 단건 조회
    // GET /api/teachers/{id}
    @GetMapping("/{id}")
    public ResponseEntity<TeacherResponseDTO> getTeacher(@PathVariable Long id) {
        TeacherResponseDTO response = teacherService.getTeacherById(id);
        return ResponseEntity.ok(response);
    }

    // 교사 전체 조회
    // GET /api/teachers
    @GetMapping
    public ResponseEntity<List<TeacherResponseDTO>> getAllTeachers() {
        List<TeacherResponseDTO> response = teacherService.getAllTeachers();
        return ResponseEntity.ok(response);
    }

    // 교사 정보 수정
    // PUT /api/teachers/{id}
    @PutMapping("/{id}")
    public ResponseEntity<TeacherResponseDTO> updateTeacher(
            @PathVariable Long id,
            @RequestBody TeacherUpdateDTO updateDTO) {
        TeacherResponseDTO response = teacherService.updateTeacher(id, updateDTO);
        return ResponseEntity.ok(response);
    }

    // 교사 삭제 (퇴직 처리)
    // DELETE /api/teachers/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable Long id) {
        teacherService.deleteTeacher(id);
        return ResponseEntity.noContent().build();
    }
}
```

### 3-2. TeacherGradeController.java (성적 입력용 - cheol 연동)

```java
package com.example.schoolmate.woo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.service.TeacherService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

// 교사가 성적 입력/수정하는 API
// cheol의 GradeController는 조회만, 여기서는 입력/수정 담당
@RestController
@RequestMapping("/api/teachers/{teacherId}/grades")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")  // 교사만 접근 가능
public class TeacherGradeController {

    private final TeacherService teacherService;

    // 성적 입력
    // POST /api/teachers/{teacherId}/grades
    @PostMapping
    public ResponseEntity<String> inputGrade(
            @PathVariable Long teacherId,
            @Valid @RequestBody GradeInputDTO gradeDTO) {
        teacherService.inputGrade(teacherId, gradeDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body("성적이 입력되었습니다.");
    }

    // 성적 수정
    // PUT /api/teachers/{teacherId}/grades/{gradeId}
    @PutMapping("/{gradeId}")
    public ResponseEntity<String> updateGrade(
            @PathVariable Long teacherId,
            @PathVariable Long gradeId,
            @RequestParam Double score) {
        teacherService.updateGrade(teacherId, gradeId, score);
        return ResponseEntity.ok("성적이 수정되었습니다.");
    }

    // 내 과목 성적 조회
    // GET /api/teachers/{teacherId}/grades?semester=1&year=FIRST
    @GetMapping
    public ResponseEntity<List<?>> getMySubjectGrades(
            @PathVariable Long teacherId,
            @RequestParam int semester,
            @RequestParam int year) {
        List<?> grades = teacherService.getMySubjectGrades(teacherId, semester, year);
        return ResponseEntity.ok(grades);
    }
}
```

### 3-3. TeacherClassController.java (담당 학급 관리)

```java
package com.example.schoolmate.woo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.service.TeacherService;

import lombok.RequiredArgsConstructor;

// 담당 학급 조회 API
@RestController
@RequestMapping("/api/teachers/{teacherId}/class")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherClassController {

    private final TeacherService teacherService;

    // 내 담당 반 학생들 조회
    // GET /api/teachers/{teacherId}/class/students?year=2025
    @GetMapping("/students")
    public ResponseEntity<ClassStudentDTO> getMyClassStudents(
            @PathVariable Long teacherId,
            @RequestParam int year) {
        ClassStudentDTO response = teacherService.getMyClassStudents(teacherId, year);
        return ResponseEntity.ok(response);
    }

    // 특정 학급 학생들 조회 (관리자용)
    // GET /api/teachers/{teacherId}/class/search?year=2025&grade=3&classNum=2
    @GetMapping("/search")
    public ResponseEntity<ClassStudentDTO> getClassStudents(
            @PathVariable Long teacherId,
            @RequestParam int year,
            @RequestParam int grade,
            @RequestParam int classNum) {
        ClassStudentDTO response = teacherService.getClassStudents(year, grade, classNum);
        return ResponseEntity.ok(response);
    }
}
```

---

## 4. 필요한 Repository 메서드 추가

### 4-1. ClassroomRepository에 추가

```java
// 담임 교사로 학급 찾기
Optional<Classroom> findByHomeroomTeacherIdAndYear(Long teacherId, int year);

// 학년도, 학년, 반으로 학급 찾기
Optional<Classroom> findByYearAndGradeAndClassNum(int year, int grade, int classNum);
```

### 4-2. StudentInfoRepository에 추가

```java
// 학급 ID로 학생 찾기
List<StudentInfo> findByClassroomCid(Long classroomId);
```

---

## 5. cheol과 woo 연동 포인트

| cheol (Student) | woo (Teacher) | 연동 방식 |
|-----------------|---------------|-----------|
| Grade 엔티티 | GradeInputDTO | woo에서 Grade 생성 |
| Subject 엔티티 | 담당 과목 확인 | Subject.teacher로 권한 체크 |
| GradeRepository | 성적 저장/수정 | woo에서 직접 사용 |
| GradeService (조회) | TeacherGradeController (입력) | 역할 분리 |

---

## 6. 적용 순서

1. [ ] woo 폴더 생성
2. [ ] DTO 파일들 생성
3. [ ] TeacherService 인터페이스 생성
4. [ ] TeacherServiceImpl 구현
5. [ ] Controller 파일들 생성
6. [ ] Repository 메서드 추가
7. [ ] Classroom 엔티티에 homeroomTeacher 필드 추가 (teacher-student-connection.md 참고)
8. [ ] 테스트

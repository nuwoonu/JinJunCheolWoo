# 교사-학생 연결 구현 가이드

## 개요

현재 교사(TeacherInfo)와 학생(StudentInfo)이 연결되어 있지 않음.
Classroom을 통해 연결하면 담임 선생님이 자기 반 학생들을 조회할 수 있음.

```
TeacherInfo ──1:N──► Classroom ──1:N──► StudentAssignment ──► StudentInfo
```

---

## 1. Classroom 엔티티 수정

**파일**: `parkjoon/entity/Classroom.java`

```java
package com.example.schoolmate.parkjoon.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "classroom", uniqueConstraints = {
    // 같은 연도에 같은 학년 같은 반이 중복되면 안됨
    @UniqueConstraint(columnNames = {"year", "grade", "class_num"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Classroom extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cid;

    // 학년도 (2025, 2026 이런식으로)
    private int year;

    // 학년 (1~6학년)
    private int grade;

    // 반 번호 (1반, 2반...)
    private int classNum;

    // ========== 여기서부터 추가하는 부분 ==========

    // 담임 교사
    // User 대신 TeacherInfo로 바꿈 (교사 정보랑 직접 연결하려고)
    // ManyToOne인 이유: 한 교사가 여러 해에 걸쳐 여러 반을 맡을 수 있어서
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homeroom_teacher_id")
    private TeacherInfo homeroomTeacher;

    // 부담임 (없을 수도 있음)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vice_teacher_id")
    private TeacherInfo viceTeacher;

    // 이 반에 소속된 학생들
    // StudentAssignment에서 classroom 필드로 연결됨 (아래에서 추가할 예정)
    @OneToMany(mappedBy = "classroom")
    private List<StudentAssignment> studentAssignments = new ArrayList<>();

    // ========== 편의 메서드 ==========

    // 학급 이름 (ex: "2025학년도 3학년 2반")
    public String getClassName() {
        return year + "학년도 " + grade + "학년 " + classNum + "반";
    }

    // 학생 수
    public int getStudentCount() {
        return studentAssignments.size();
    }
}
```

---

## 2. StudentAssignment에 Classroom 연결 추가

**파일**: `common/entity/info/assignment/StudentAssignment.java`

기존 코드에 아래 부분 추가:

```java
// ========== import 추가 ==========
import com.example.schoolmate.parkjoon.entity.Classroom;

// ========== 필드 추가 (기존 필드들 아래에) ==========

// 소속 학급
// 학생이 어느 반인지 알 수 있음
// 이걸로 담임 선생님도 찾을 수 있음 (classroom.getHomeroomTeacher())
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "classroom_id")
private Classroom classroom;

// ========== Builder에도 classroom 추가 ==========
@Builder
public StudentAssignment(StudentInfo studentInfo, int schoolYear, Integer grade,
                         Integer classNum, Integer studentNum, Classroom classroom) {
    this.studentInfo = studentInfo;
    this.schoolYear = schoolYear;
    this.grade = grade;
    this.classNum = classNum;
    this.studentNum = studentNum;
    this.classroom = classroom;  // 추가
}

// ========== 편의 메서드 추가 ==========

// 담임 선생님 바로 가져오기
public TeacherInfo getHomeroomTeacher() {
    return classroom != null ? classroom.getHomeroomTeacher() : null;
}
```

---

## 3. TeacherInfo에 담임 학급 조회 메서드 추가 (선택)

**파일**: `common/entity/info/TeacherInfo.java`

```java
// ========== import 추가 ==========
import java.util.ArrayList;
import java.util.List;
import com.example.schoolmate.parkjoon.entity.Classroom;
import jakarta.persistence.OneToMany;

// ========== 필드 추가 ==========

// 내가 담임인 학급들 (여러 해에 걸쳐 담임 가능)
@OneToMany(mappedBy = "homeroomTeacher")
private List<Classroom> homeroomClassrooms = new ArrayList<>();

// 내가 부담임인 학급들
@OneToMany(mappedBy = "viceTeacher")
private List<Classroom> viceClassrooms = new ArrayList<>();

// ========== 편의 메서드 ==========

// 특정 연도에 담임 맡은 학급 가져오기
public Classroom getHomeroomClassroom(int year) {
    return homeroomClassrooms.stream()
            .filter(c -> c.getYear() == year)
            .findFirst()
            .orElse(null);
}

// 담임반 학생들 가져오기
public List<StudentAssignment> getMyStudents(int year) {
    Classroom myClass = getHomeroomClassroom(year);
    return myClass != null ? myClass.getStudentAssignments() : new ArrayList<>();
}
```

---

## 4. 연결 관계 정리

| 엔티티 | 필드 | 연결 대상 | 관계 | 설명 |
|--------|------|-----------|------|------|
| Classroom | homeroomTeacher | TeacherInfo | N:1 | 담임 |
| Classroom | viceTeacher | TeacherInfo | N:1 | 부담임 |
| Classroom | studentAssignments | StudentAssignment | 1:N | 소속 학생들 |
| StudentAssignment | classroom | Classroom | N:1 | 소속 학급 |
| TeacherInfo | homeroomClassrooms | Classroom | 1:N | 담임 학급들 |

---

## 5. 사용 예시

```java
// 교사가 자기 반 학생 목록 조회
TeacherInfo teacher = teacherRepository.findById(teacherId);
List<StudentAssignment> myStudents = teacher.getMyStudents(2025);

// 학생의 담임 선생님 조회
StudentAssignment assignment = student.getCurrentAssignment(2025);
TeacherInfo homeroom = assignment.getHomeroomTeacher();
```

---

## 6. 적용 순서

1. [ ] Classroom.java 수정 (User → TeacherInfo로 변경, 양방향 관계 추가)
2. [ ] StudentAssignment.java에 classroom 필드 추가
3. [ ] TeacherInfo.java에 학급 관계 추가 (선택사항)
4. [ ] 기존 데이터 마이그레이션 (필요시)

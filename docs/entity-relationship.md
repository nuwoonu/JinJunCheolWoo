# 엔티티 관계 설계 문서

## 1. 현재 구현된 엔티티 (기존)

```
User ──1:N──► BaseInfo ──상속──┬──► StudentInfo ──1:N──► StudentAssignment
                               │         │
                               │         └──1:N──► FamilyRelation ◄──N:1── ParentInfo
                               │
                               ├──► TeacherInfo (독립적)
                               │
                               ├──► ParentInfo
                               │
                               └──► StaffInfo
```

### 엔티티 목록

| 엔티티            | 파일 경로                                              | 상태    |
| ----------------- | ------------------------------------------------------ | ------- |
| User              | `common/entity/user/User.java`                         | ✅ 있음 |
| BaseInfo          | `common/entity/info/BaseInfo.java`                     | ✅ 있음 |
| StudentInfo       | `common/entity/info/StudentInfo.java`                  | ✅ 있음 |
| TeacherInfo       | `common/entity/info/TeacherInfo.java`                  | ✅ 있음 |
| ParentInfo        | `common/entity/info/ParentInfo.java`                   | ✅ 있음 |
| StaffInfo         | `common/entity/info/StaffInfo.java`                    | ✅ 있음 |
| StudentAssignment | `common/entity/info/assignment/StudentAssignment.java` | ✅ 있음 |
| FamilyRelation    | `common/entity/info/FamilyRelation.java`               | ✅ 있음 |

---

## 2. 현재 문제점

**교사(TeacherInfo)가 학생/학부모와 연결되어 있지 않음**

| 연결          | 상태                         |
| ------------- | ---------------------------- |
| 학생 ↔ 학부모 | ✅ FamilyRelation으로 연결됨 |
| 교사 ↔ 학생   | ❌ 연결 없음                 |
| 교사 ↔ 학부모 | ❌ 연결 없음                 |
| 교사 ↔ 학급   | ❌ 연결 없음                 |

---

## 3. 추가할 엔티티

### 3.1 Classroom (학급)

```java
@Entity
@Table(name = "classroom")
public class Classroom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int schoolYear;     // 학년도 (2025, 2026)
    private int grade;          // 학년 (1~6)
    private int classNum;       // 반 번호

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homeroom_teacher_id")
    private TeacherInfo homeroomTeacher;  // 담임 교사

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vice_teacher_id")
    private TeacherInfo viceTeacher;  // 부담임 (선택)

    @OneToMany(mappedBy = "classroom")
    private List<StudentAssignment> students;  // 소속 학생들
}
```

**파일 위치**: `common/entity/classroom/Classroom.java`

---

### 3.2 SubjectClass (과목 수업)

```java
@Entity
@Table(name = "subject_class")
public class SubjectClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subjectName;   // 과목명 (국어, 수학 등)
    private int schoolYear;       // 학년도
    private int semester;         // 학기 (1, 2)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private TeacherInfo teacher;  // 담당 교사

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;  // 대상 학급
}
```

**파일 위치**: `common/entity/subject/SubjectClass.java`

---

### 3.3 StudentAssignment 수정

```java
// 기존 필드에 추가
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "classroom_id")
private Classroom classroom;  // 소속 학급
```

---

## 4. 추가 후 전체 관계도

```
User ──1:N──► BaseInfo ──상속──┬──► StudentInfo ──1:N──► StudentAssignment ◄──N:1── Classroom ◄──N:1── TeacherInfo
                               │         │                                              │
                               │         └──1:N──► FamilyRelation ◄──N:1── ParentInfo   │
                               │                                                        │
                               ├──► TeacherInfo ──1:N──► SubjectClass ──N:1─────────────┘
                               │
                               ├──► ParentInfo
                               │
                               └──► StaffInfo
```

### 교사 관점 연결 경로

```
담임 조회:    TeacherInfo ──► Classroom ──► StudentAssignment ──► StudentInfo ──► FamilyRelation ──► ParentInfo
과목 담당:    TeacherInfo ──► SubjectClass ──► Classroom ──► StudentAssignment ──► StudentInfo
```

---

## 5. 테이블 관계 요약

| FROM              | 관계 | TO                | 설명                          |
| ----------------- | ---- | ----------------- | ----------------------------- |
| User              | 1:N  | BaseInfo          | 한 유저가 여러 신분 보유 가능 |
| TeacherInfo       | 1:N  | Classroom         | 담임/부담임                   |
| TeacherInfo       | 1:N  | SubjectClass      | 과목 담당                     |
| Classroom         | 1:N  | StudentAssignment | 학급 소속 학생들              |
| Classroom         | 1:N  | SubjectClass      | 학급에서 진행되는 수업들      |
| StudentAssignment | N:1  | StudentInfo       | 학생 정보                     |
| StudentInfo       | 1:N  | FamilyRelation    | 가족 관계                     |
| FamilyRelation    | N:1  | ParentInfo        | 학부모 정보                   |

---

## 6. 구현 순서

1. [ ] Classroom 엔티티 생성
2. [ ] ClassroomRepository 생성
3. [ ] StudentAssignment에 classroom 필드 추가
4. [ ] SubjectClass 엔티티 생성
5. [ ] SubjectClassRepository 생성
6. [ ] TeacherInfo에 편의 메서드 추가

---

## 7. 메모/수정사항

(여기에 수정할 내용을 작성하세요)

package com.example.schoolmate.repository;

import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.entity.user.constant.Year;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.repository.UserRepository;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@Disabled
@SpringBootTest
public class SchoolMateRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentInfoRepository studentInfoRepository;

    @Autowired
    private TeacherInfoRepository teacherInfoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==================== CREATE 테스트 ====================

    // @Test
    // @Transactional
    // @Commit
    // @DisplayName("학생 유저 생성 테스트")
    // public void insertStudentTest() {
    // IntStream.rangeClosed(1, 5).forEach(i -> {
    // // 1. User 생성 (계정)
    // User user = User.builder()
    // .email("student" + i + "@test.com")
    // .password(passwordEncoder.encode("1111"))
    // .name("학생" + i)
    // .build();
    // user.addRole(UserRole.STUDENT);

    // // 2. StudentInfo 생성 (신분 정보)
    // StudentInfo studentInfo = new StudentInfo();
    // studentInfo.setUser(user);
    // studentInfo.setCode("S2026" + String.format("%03d", i));
    // studentInfo.setStudentIdentityNum("2026" + String.format("%04d", i));
    // studentInfo.setStatus(StudentStatus.ENROLLED);

    // // 3. 학년 배정 추가 (2026학년도)
    // StudentAssignment assignment = StudentAssignment.builder()
    // .studentInfo(studentInfo)
    // .schoolYear(2026)
    // .grade(i % 3 + 1) // 1~3학년
    // .classNum(i % 5 + 1) // 1~5반
    // .studentNum(i) // 번호
    // .build();
    // studentInfo.getAssignments().add(assignment);

    // // 4. User에 Info 연결 후 저장 (Cascade)
    // user.getInfos().add(studentInfo);
    // userRepository.save(user);

    // System.out.println("학생 저장 완료: " + user.getEmail());
    // System.out.println(" - 학번: " + studentInfo.getStudentIdentityNum());
    // System.out.println(" - 2026년 배정: " + assignment.getGrade() + "학년 "
    // + assignment.getClassNum() + "반 " + assignment.getStudentNum() + "번");
    // });
    // }

    @Test
    @Transactional
    @Commit
    @DisplayName("학생 유저 생성 테스트")
    public void insertStudentTest() {
        Year[] years = { Year.FIRST, Year.SECOND, Year.THIRD };

        IntStream.rangeClosed(1, 5).forEach(i -> {
            // 1. User 생성 (계정)
            User user = User.builder()
                    .email("student" + i + "@test.com")
                    .password(passwordEncoder.encode("1111"))
                    .name("학생" + i)
                    .build();
            user.addRole(UserRole.STUDENT);

            // 2. StudentInfo 생성 (신분 정보)
            StudentInfo studentInfo = new StudentInfo();
            studentInfo.setUser(user);
            studentInfo.setStudentIdentityNum("2026" + String.format("%04d", i)); // 고유 학번
            studentInfo.setStudentNumber((long) i); // 출석번호
            studentInfo.getClassroom().setYear(1); // Year enum (FIRST, SECOND, THIRD)
            studentInfo.getClassroom().setClassNum(i % 5 + 1); // 1~5반
            studentInfo.setStatus(StudentStatus.ENROLLED);

            // 3. 학년 배정 추가 (2026학년도)
            StudentAssignment assignment = StudentAssignment.builder()
                    .studentInfo(studentInfo)
                    .schoolYear(2026)
                    .grade(i % 3 + 1) // 1~3학년
                    .classNum(i % 5 + 1) // 1~5반
                    .studentNum(i) // 번호
                    .build();
            studentInfo.getAssignments().add(assignment);

            // 4. User에 Info 연결 후 저장 (Cascade)
            user.getInfos().add(studentInfo);
            userRepository.save(user);

            System.out.println("학생 저장 완료: " + user.getEmail());
            System.out.println(" - 고유학번: " + studentInfo.getStudentIdentityNum());
            System.out.println(" - 학년: " + studentInfo.getClassroom().getYear());
            System.out.println(" - 2026년 배정: " + assignment.getGrade() + "학년 "
                    + assignment.getClassNum() + "반 " + assignment.getStudentNum() + "번");
        });
    }

    @Test
    @Transactional
    @Commit
    @DisplayName("교사 유저 생성 테스트")
    public void insertTeacherTest() {
        String[] subjects = { "수학", "영어", "과학", "국어", "사회" };
        String[] departments = { "교무부", "연구부", "학생부" };

        IntStream.rangeClosed(1, 3).forEach(i -> {
            // 1. User 생성
            User user = User.builder()
                    .email("teacher" + i + "@test.com")
                    .password(passwordEncoder.encode("1111"))
                    .name("선생님" + i)
                    .build();
            user.addRole(UserRole.TEACHER);

            // 2. TeacherInfo 생성
            TeacherInfo teacherInfo = new TeacherInfo();
            teacherInfo.setUser(user);
            teacherInfo.setCode("T2026" + String.format("%03d", i));
            teacherInfo.setSubject(subjects[i - 1]);
            teacherInfo.setDepartment(departments[i - 1]);
            teacherInfo.setPosition(i == 1 ? "부장" : "평교사");
            teacherInfo.setStatus(TeacherStatus.EMPLOYED);

            // 3. 연결 및 저장
            user.getInfos().add(teacherInfo);
            userRepository.save(user);

            System.out.println("교사 저장 완료: " + user.getEmail());
            System.out.println(" - 사번: " + teacherInfo.getCode());
            System.out.println(" - 과목: " + teacherInfo.getSubject());
            System.out.println(" - 부서: " + teacherInfo.getDepartment());
        });
    }

    @Test
    @Transactional
    @Commit
    @DisplayName("학부모 유저 생성 및 자녀 연결 테스트")
    public void insertParentTest() {
        // 먼저 학생 조회 (이미 생성된 학생이 있다고 가정)
        StudentInfo student = studentInfoRepository.findAll().stream().findFirst().orElse(null);

        if (student == null) {
            System.out.println("학생 데이터가 없습니다. insertStudentTest()를 먼저 실행하세요.");
            return;
        }

        // 1. 학부모 User 생성
        User parentUser = User.builder()
                .email("parent1@test.com")
                .password(passwordEncoder.encode("1111"))
                .name("학부모1")
                .build();
        parentUser.addRole(UserRole.PARENT);

        // 2. ParentInfo 생성
        ParentInfo parentInfo = new ParentInfo();
        parentInfo.setUser(parentUser);
        parentInfo.setCode("P001");
        parentInfo.setParentName("학부모1");
        parentInfo.setPhoneNumber("010-1234-5678");
        parentInfo.setStatus(ParentStatus.ACTIVE);

        // 3. FamilyRelation으로 자녀 연결
        FamilyRelation relation = new FamilyRelation();
        relation.setStudentInfo(student);
        relation.setParentInfo(parentInfo);
        relation.setRelationship(FamilyRelationship.FATHER); // 또는 MOTHER
        relation.setRepresentative(true); // 주 보호자

        // 양방향 연결
        parentInfo.getChildrenRelations().add(relation);
        student.getFamilyRelations().add(relation);

        // 4. 저장
        parentUser.getInfos().add(parentInfo);
        userRepository.save(parentUser);

        System.out.println("학부모 저장 완료: " + parentUser.getEmail());
        System.out.println(" - 자녀: " + student.getUser().getName());
        System.out.println(" - 관계: " + relation.getRelationship());
    }

    @Test
    @Transactional
    @Commit
    @DisplayName("교사+학부모 복합 역할 유저 생성 테스트")
    public void insertTeacherParentTest() {
        // 학생 조회
        StudentInfo student = studentInfoRepository.findAll().stream()
                .skip(1).findFirst().orElse(null);

        if (student == null) {
            System.out.println("학생 데이터가 없습니다. insertStudentTest()를 먼저 실행하세요.");
            return;
        }

        // 1. User 생성 (복합 역할)
        User user = User.builder()
                .email("teacher_parent@test.com")
                .password(passwordEncoder.encode("1111"))
                .name("김교사(학부모)")
                .build();
        user.addRole(UserRole.TEACHER);
        user.addRole(UserRole.PARENT);

        // 2. TeacherInfo 생성
        TeacherInfo teacherInfo = new TeacherInfo();
        teacherInfo.setUser(user);
        teacherInfo.setCode("T2026099");
        teacherInfo.setSubject("음악");
        teacherInfo.setDepartment("교무부");
        teacherInfo.setStatus(TeacherStatus.EMPLOYED);

        // 3. ParentInfo 생성 및 자녀 연결
        ParentInfo parentInfo = new ParentInfo();
        parentInfo.setUser(user);
        parentInfo.setCode("P099");
        parentInfo.setParentName("김교사");
        parentInfo.setPhoneNumber("010-9999-8888");
        parentInfo.setStatus(ParentStatus.ACTIVE);

        FamilyRelation relation = new FamilyRelation();
        relation.setStudentInfo(student);
        relation.setParentInfo(parentInfo);
        relation.setRelationship(FamilyRelationship.MOTHER);
        relation.setRepresentative(true);
        parentInfo.getChildrenRelations().add(relation);
        student.getFamilyRelations().add(relation);

        // 4. 두 Info 모두 연결
        user.getInfos().add(teacherInfo);
        user.getInfos().add(parentInfo);
        userRepository.save(user);

        System.out.println("복합 역할 유저 저장 완료: " + user.getEmail());
        System.out.println(" - 역할: " + user.getRoles());
        System.out.println(" - Info 개수: " + user.getInfos().size());
    }

    // ==================== READ 테스트 ====================

    @Test
    @Transactional
    @DisplayName("이메일로 유저 조회 및 Info 확인")
    public void findByEmailTest() {
        String email = "student1@test.com";

        userRepository.findByEmail(email).ifPresentOrElse(user -> {
            System.out.println("===== 유저 정보 =====");
            System.out.println("UID: " + user.getUid());
            System.out.println("Email: " + user.getEmail());
            System.out.println("Name: " + user.getName());
            System.out.println("Roles: " + user.getRoles());
            System.out.println("Info 개수: " + user.getInfos().size());

            // StudentInfo 가져오기
            StudentInfo studentInfo = user.getInfo(StudentInfo.class);
            if (studentInfo != null) {
                System.out.println("===== 학생 정보 =====");
                System.out.println("학번: " + studentInfo.getStudentIdentityNum());
                System.out.println("상태: " + studentInfo.getStatus());

                // 현재 학년도 배정 정보
                StudentAssignment current = studentInfo.getCurrentAssignment(2026);
                if (current != null) {
                    System.out.println("2026년 배정: " + current.getGrade() + "학년 "
                            + current.getClassNum() + "반 " + current.getStudentNum() + "번");
                }
            }
        }, () -> System.out.println("유저를 찾을 수 없습니다: " + email));
    }

    @Test
    @Transactional
    @DisplayName("전체 학생 목록 조회")
    public void findAllStudentsTest() {
        var students = studentInfoRepository.findAll();

        System.out.println("===== 전체 학생 목록 =====");
        System.out.println("총 학생 수: " + students.size());

        students.forEach(s -> {
            System.out.println("---");
            System.out.println("이름: " + (s.getUser() != null ? s.getUser().getName() : "N/A"));
            System.out.println("학번: " + s.getStudentIdentityNum());
            System.out.println("상태: " + s.getStatus());

            StudentAssignment current = s.getCurrentAssignment(2026);
            if (current != null) {
                System.out.println("배정: " + current.getGrade() + "-" + current.getClassNum()
                        + "-" + current.getStudentNum());
            }
        });
    }

    @Test
    @Transactional
    @DisplayName("전체 교사 목록 조회")
    public void findAllTeachersTest() {
        var teachers = teacherInfoRepository.findAll();

        System.out.println("===== 전체 교사 목록 =====");
        System.out.println("총 교사 수: " + teachers.size());

        teachers.forEach(t -> {
            System.out.println("---");
            System.out.println("이름: " + (t.getUser() != null ? t.getUser().getName() : "N/A"));
            System.out.println("사번: " + t.getCode());
            System.out.println("과목: " + t.getSubject());
            System.out.println("부서: " + t.getDepartment());
            System.out.println("직책: " + t.getPosition());
        });
    }

    // ==================== UPDATE 테스트 ====================

    @Test
    @Transactional
    @Commit
    @DisplayName("학생 학년 배정 추가 (진급)")
    public void updateStudentAssignmentTest() {
        StudentInfo student = studentInfoRepository.findAll().stream().findFirst().orElse(null);

        if (student == null) {
            System.out.println("학생 데이터가 없습니다.");
            return;
        }

        // 기존 배정 확인
        StudentAssignment oldAssignment = student.getCurrentAssignment(2026);
        int newGrade = (oldAssignment != null ? oldAssignment.getGrade() : 0) + 1;

        // 2027학년도 새 배정 추가 (진급)
        StudentAssignment newAssignment = StudentAssignment.builder()
                .studentInfo(student)
                .schoolYear(2027)
                .grade(Math.min(newGrade, 3)) // 최대 3학년
                .classNum(2)
                .studentNum(10)
                .build();

        student.getAssignments().add(newAssignment);
        studentInfoRepository.save(student);

        System.out.println("학생 진급 완료: " + student.getUser().getName());
        System.out.println(" - 2026년: " + (oldAssignment != null ? oldAssignment.getGrade() + "학년" : "없음"));
        System.out.println(" - 2027년: " + newAssignment.getGrade() + "학년 "
                + newAssignment.getClassNum() + "반 " + newAssignment.getStudentNum() + "번");
    }

    @Test
    @Transactional
    @Commit
    @DisplayName("교사 정보 수정")
    public void updateTeacherInfoTest() {
        TeacherInfo teacher = teacherInfoRepository.findAll().stream().findFirst().orElse(null);

        if (teacher == null) {
            System.out.println("교사 데이터가 없습니다.");
            return;
        }

        String oldDept = teacher.getDepartment();

        // 부서 이동
        teacher.update(
                teacher.getSubject(),
                "연구부", // 부서 변경
                "부장", // 직책 변경
                TeacherStatus.EMPLOYED);

        teacherInfoRepository.save(teacher);

        System.out.println("교사 정보 수정 완료: " + teacher.getUser().getName());
        System.out.println(" - 부서: " + oldDept + " -> " + teacher.getDepartment());
        System.out.println(" - 직책: " + teacher.getPosition());
    }

    // ==================== DELETE 테스트 ====================

    @Test
    @Transactional
    @Commit
    @DisplayName("유저 삭제 (Cascade로 Info도 삭제)")
    public void deleteUserTest() {
        String email = "student5@test.com";

        userRepository.findByEmail(email).ifPresentOrElse(user -> {
            System.out.println("삭제할 유저: " + user.getName() + " (" + user.getEmail() +
                    ")");
            userRepository.delete(user);
            System.out.println("삭제 완료");
        }, () -> System.out.println("유저를 찾을 수 없습니다: " + email));
    }
}

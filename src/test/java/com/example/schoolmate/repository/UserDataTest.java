package com.example.schoolmate.repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StaffInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.ClassroomRepository;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.user.constant.AchievementsGrade;
import com.example.schoolmate.common.entity.user.constant.Gender;
import com.example.schoolmate.cheol.entity.AwardsAndHonors;
import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.entity.MedicalDetails;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.AwardsAndHonorsRepository;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.cheol.repository.MedicalDetailsRepository;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import com.example.schoolmate.common.entity.user.constant.Semester;
import com.example.schoolmate.common.entity.user.constant.TestType;
import com.example.schoolmate.common.entity.user.constant.Year;

//Joon님의 생성
@SpringBootTest
public class UserDataTest {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClassroomRepository classroomRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private GradeRepository gradeRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private StudentInfoRepository studentInfoRepository;
    @Autowired
    private MedicalDetailsRepository medicalDetailsRepository;
    @Autowired
    private AwardsAndHonorsRepository awardsAndHonorsRepository;

    // @Test
    // @Transactional
    // @Rollback(false)
    // void createUsersTest() {
    // // 1. 학부모 10명 생성
    // List<ParentInfo> parentInfoList = new ArrayList<>();
    // for (int i = 1; i <= 10; i++) {
    // User parentUser = User.builder()
    // .email("parent" + i + "@school.com")
    // .name("학부모" + i)
    // .password("1234")
    // .roles(new HashSet<>(Set.of(UserRole.PARENT)))
    // .build();

    // ParentInfo parentInfo = new ParentInfo();
    // parentInfo.setCode("P" + String.format("%04d", i));
    // parentInfo.setEmergencyContact("010-0000-" + String.format("%04d", i));
    // // ParentStatus Enum이 있다면 적용 (없다면 String 유지 가능)
    // parentInfo.setStatus(ParentStatus.ACTIVE);
    // parentInfo.setUser(parentUser);

    // parentUser.getInfos().add(parentInfo);
    // userRepository.save(parentUser);
    // parentInfoList.add(parentInfo);
    // }

    // // // 2. 학생 10명 생성 및 학부모 매칭
    // // for (int i = 1; i <= 10; i++) {
    // // User studentUser = User.builder()
    // // .email("student" + i + "@school.com")
    // // .name("학생" + i)
    // // .password("1234")
    // // .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
    // // .build();

    // // StudentInfo studentInfo = new StudentInfo();
    // // studentInfo.setCode("2026" + String.format("%04d", i));
    // // studentInfo.setGrade(1);
    // // studentInfo.setClassNum(i % 5 + 1);
    // // // StudentStatus Enum 적용
    // // studentInfo.setStatus(StudentStatus.ENROLLED);
    // // studentInfo.setUser(studentUser);
    // // studentInfo.setParent(parentInfoList.get(i - 1));

    // // studentUser.getInfos().add(studentInfo);
    // // userRepository.save(studentUser);
    // // }

    // // 3. 교사 10명 생성
    // for (int i = 1; i <= 10; i++) {
    // User teacherUser = User.builder()
    // .email("teacher" + i + "@school.com")
    // .name("교사" + i)
    // .password("1234")
    // .roles(new HashSet<>(Set.of(UserRole.TEACHER)))
    // .build();

    // TeacherInfo teacherInfo = new TeacherInfo();
    // teacherInfo.setCode("T" + String.format("%04d", i));
    // teacherInfo.setSubject(i % 2 == 0 ? "수학" : "영어");
    // teacherInfo.setDepartment("교무부");
    // // TeacherStatus Enum 적용
    // teacherInfo.setStatus(TeacherStatus.EMPLOYED);
    // teacherInfo.setUser(teacherUser);

    // teacherUser.getInfos().add(teacherInfo);
    // userRepository.save(teacherUser);
    // }

    // // 4. 행정직원 10명 생성
    // for (int i = 1; i <= 10; i++) {
    // User staffUser = User.builder()
    // .email("staff" + i + "@school.com")
    // .name("직원" + i)
    // .password("1234")
    // .roles(new HashSet<>(Set.of(UserRole.STAFF)))
    // .build();

    // StaffInfo staffInfo = new StaffInfo();
    // staffInfo.setCode("S" + String.format("%04d", i));
    // staffInfo.setJobTitle("주무관");
    // // StaffStatus Enum 적용
    // staffInfo.setStatus(StaffStatus.EMPLOYED);
    // staffInfo.setUser(staffUser);

    // staffUser.getInfos().add(staffInfo);
    // userRepository.save(staffUser);
    // }
    // }

    @Test
    @Transactional
    @Rollback(false) // DB에 실제로 반영하기 위해 false 설정
    void createAdminAccount() {
        // 1. 이미 해당 이메일의 어드민이 있는지 확인 (중복 방지)
        String adminEmail = "admin@school.com";
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            System.out.println("이미 관리자 계정이 존재합니다.");
            return;
        }

        // 2. 관리자 유저 엔티티 생성
        User adminUser = User.builder()
                .email(adminEmail)
                .name("최고관리자")
                // 비밀번호를 암호화하여 저장 (로그인 시 '1234' 입력)
                .password(passwordEncoder.encode("1234"))
                .roles(new HashSet<>(Set.of(UserRole.ADMIN)))
                .build();
        // 4. DB 저장
        userRepository.save(adminUser);

        System.out.println("관리자 계정 생성 완료: " + adminEmail);
    }

    @Test
    @Transactional
    @Rollback(false)
    void createStudentAccount() {
        String studentEmail = "student-test@school.com";
        if (userRepository.findByEmail(studentEmail).isPresent()) {
            System.out.println("이미 학생 계정이 존재합니다: " + studentEmail);
            return;
        }

        User studentUser = User.builder()
                .email(studentEmail)
                .name("테스트학생")
                .password(passwordEncoder.encode("1234"))
                .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                .build();

        StudentInfo studentInfo = new StudentInfo();
        studentInfo.setUser(studentUser);
        studentInfo.setCode("ST-TEST-0001");
        studentInfo.setStudentNumber(1L);
        studentInfo.setBirthDate(LocalDate.of(2010, 5, 1));
        studentInfo.setAddress("서울시 테스트구 테스트로 1");
        studentInfo.setPhone("010-1234-5678");
        studentInfo.setStatus(StudentStatus.ENROLLED);

        studentUser.getInfos().add(studentInfo);
        userRepository.save(studentUser);

        System.out.println("학생 계정 생성 완료: " + studentEmail);
    }

    @Test
    @Transactional
    @Rollback(false)
    void createParentAccount() {
        String parentEmail = "parent1@test.com";
        if (userRepository.findByEmail(parentEmail).isPresent()) {
            System.out.println("이미 학부모 계정이 존재합니다: " + parentEmail);
            return;
        }

        User parentUser = User.builder()
                .email(parentEmail)
                .name("테스트학부모")
                .phoneNumber("010-9999-0001")
                .password(passwordEncoder.encode("1234"))
                .roles(new HashSet<>(Set.of(UserRole.PARENT)))
                .build();

        ParentInfo parentInfo = new ParentInfo();
        parentInfo.setUser(parentUser);
        parentInfo.setCode("P-TEST-0001");
        parentInfo.setParentName(parentUser.getName());
        parentInfo.setPhoneNumber(parentUser.getPhoneNumber());
        parentInfo.setStatus(ParentStatus.ACTIVE);

        parentUser.getInfos().add(parentInfo);
        userRepository.save(parentUser);

        System.out.println("학부모 계정 생성 완료: " + parentEmail);
    }

    @Test
    @Transactional
    @Rollback(false)
    void createFullStudentAccount() {
        String studentEmail = "fullstudent@school.com";
        if (userRepository.findByEmail(studentEmail).isPresent()) {
            System.out.println("이미 학생 계정이 존재합니다: " + studentEmail);
            return;
        }

        // 1. Classroom 조회 또는 생성
        Classroom classroom = classroomRepository.findByYearAndGradeAndClassNum(2025, 3, 2)
                .orElseGet(() -> {
                    Classroom newClassroom = Classroom.builder()
                            .year(2025)
                            .grade(3)
                            .classNum(2)
                            .build();
                    return classroomRepository.save(newClassroom);
                });

        // 2. User 생성 (모든 필드 입력)
        User studentUser = User.builder()
                .email(studentEmail)
                .name("김철수")
                .phoneNumber("010-1234-5678")
                .password(passwordEncoder.encode("1234"))
                .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                .build();

        // 3. StudentInfo 생성 (모든 필드 입력)
        StudentInfo studentInfo = new StudentInfo();
        studentInfo.setUser(studentUser);
        studentInfo.setCode("2025030215"); // 고유 학번 코드
        studentInfo.setStudentNumber(15L); // 번호
        studentInfo.setClassroom(classroom); // 학급 (2025년 3학년 2반)
        studentInfo.setBirthDate(LocalDate.of(2012, 3, 15)); // 생년월일
        studentInfo.setAddress("서울특별시 강남구 테헤란로 123"); // 주소
        studentInfo.setPhone("010-1234-5678"); // 연락처
        studentInfo.setGender(Gender.MALE); // 성별
        studentInfo.setStatus(StudentStatus.ENROLLED); // 재학 상태
        studentInfo.setBasicHabits("성실하고 책임감이 강함"); // 기초 생활 기록
        studentInfo.setSpecialNotes("수학 영재반 소속"); // 특이사항

        // 4. User와 StudentInfo 연결 후 저장
        studentUser.getInfos().add(studentInfo);
        userRepository.save(studentUser);

        System.out.println("========================================");
        System.out.println("완전한 학생 계정 생성 완료!");
        System.out.println("이메일: " + studentEmail);
        System.out.println("이름: " + studentUser.getName());
        System.out.println("학급: " + classroom.getClassName());
        System.out.println("학번: " + studentInfo.getFullStudentNumber());
        System.out.println("========================================");
    }

    @Test
    @Transactional
    @Rollback(false)
    void createGradesForStudent() {
        Long studentId = 1L;

        // 1. 학생 조회
        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        System.out.println("========================================");
        System.out.println("학생 정보: " + student.getCode());

        // 2. 4개 과목 생성 또는 조회
        String[] subjectCodes = { "KOR001", "MATH001", "ENG001", "SCI001" };
        String[] subjectNames = { "국어", "수학", "영어", "과학" };

        List<Subject> subjects = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            final String code = subjectCodes[i];
            final String name = subjectNames[i];

            Subject subject = subjectRepository.findByCode(code)
                    .orElseGet(() -> {
                        Subject newSubject = Subject.builder()
                                .code(code)
                                .name(name)
                                .year(Year.FIRST)
                                .build();
                        return subjectRepository.save(newSubject);
                    });
            subjects.add(subject);
            System.out.println("과목: " + subject.getName() + " (" + subject.getCode() + ")");
        }

        // 3. 각 과목에 대해 1학기/2학기 중간/기말 성적 생성 (랜덤 점수)
        java.util.Random random = new java.util.Random();
        int gradeCount = 0;

        for (Subject subject : subjects) {
            // 1학기 중간고사
            Grade firstMidterm = Grade.builder()
                    .student(student)
                    .subject(subject)
                    .semester(Semester.FIRST)
                    .testType(TestType.MIDTERMTEST)
                    .year(Year.FIRST)
                    .score((double) (50 + random.nextInt(51))) // 50~100점
                    .build();
            gradeRepository.save(firstMidterm);
            gradeCount++;

            // 1학기 기말고사
            Grade firstFinal = Grade.builder()
                    .student(student)
                    .subject(subject)
                    .semester(Semester.FIRST)
                    .testType(TestType.FINALTEST)
                    .year(Year.FIRST)
                    .score((double) (50 + random.nextInt(51)))
                    .build();
            gradeRepository.save(firstFinal);
            gradeCount++;

            // 2학기 중간고사
            Grade secondMidterm = Grade.builder()
                    .student(student)
                    .subject(subject)
                    .semester(Semester.FALL)
                    .testType(TestType.MIDTERMTEST)
                    .year(Year.FIRST)
                    .score((double) (50 + random.nextInt(51)))
                    .build();
            gradeRepository.save(secondMidterm);
            gradeCount++;

            // 2학기 기말고사
            Grade secondFinal = Grade.builder()
                    .student(student)
                    .subject(subject)
                    .semester(Semester.FALL)
                    .testType(TestType.FINALTEST)
                    .year(Year.FIRST)
                    .score((double) (50 + random.nextInt(51)))
                    .build();
            gradeRepository.save(secondFinal);
            gradeCount++;

            System.out.println(subject.getName() + " 성적 4개 생성 완료");
        }

        System.out.println("========================================");
        System.out.println("총 " + gradeCount + "개의 성적 데이터 생성 완료!");
        System.out.println("학생 ID: " + studentId);
        System.out.println("========================================");
    }

    @Test
    @Transactional
    @Rollback(false)
    void createMedicalStudent() {
        Long studentId = 1L;

        // 1. 학생 조회
        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        System.out.println("========================================");
        System.out.println("학생 정보: " + student.getCode());

        // 2. 상세 주소 추가
        student.setAddressDetail("솔데스크아파트 101동 202호");
        studentInfoRepository.save(student);
        System.out.println("상세 주소 추가 완료: " + student.getAddressDetail());

        // 3. 의료 정보 생성 및 저장
        MedicalDetails medicalDetails = MedicalDetails.builder()
                .BloodGroup("A+")
                .Height(175.5)
                .Weight(68.0)
                .studentInfo(student)
                .build();

        medicalDetailsRepository.save(medicalDetails);

        System.out.println("========================================");
        System.out.println("의료 정보 생성 완료!");
        System.out.println("혈액형: " + medicalDetails.getBloodGroup());
        System.out.println("키: " + medicalDetails.getHeight() + "cm");
        System.out.println("체중: " + medicalDetails.getWeight() + "kg");
        System.out.println("========================================");
    }

    @Test
    @Transactional
    @Rollback(false)
    void createAwardStudent() {
        Long studentId = 1L;

        // 1. 학생 조회
        StudentInfo student = studentInfoRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));
        IntStream.rangeClosed(1, 5).forEach(i -> {
            AwardsAndHonors award = AwardsAndHonors.builder()
                    .name("교내 수상 " + i)
                    .AwardingOrganization("스쿨메이트")
                    .achievementsGrade(AchievementsGrade.GOLD)
                    .day(LocalDate.parse("2013-05-11"))
                    .studentInfo(student)
                    .build();
            awardsAndHonorsRepository.save(award);

        });

    }

}

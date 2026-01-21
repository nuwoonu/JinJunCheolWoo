// package com.example.schoolmate.repository;

// import com.example.schoolmate.common.entity.AdminEntity;
// import com.example.schoolmate.common.entity.Parent;
// import com.example.schoolmate.common.entity.Student;
// import com.example.schoolmate.common.entity.Teacher;
// import com.example.schoolmate.common.entity.User;
// import com.example.schoolmate.common.entity.constant.UserRole;
// import com.example.schoolmate.common.repository.UserRepository;

// import org.junit.jupiter.api.Disabled;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.test.annotation.Commit;
// import org.springframework.transaction.annotation.Transactional;

// import java.util.Optional;
// import java.util.stream.IntStream;

// import static org.assertj.core.api.Assertions.assertThat;

// @Disabled
// @SpringBootTest
// public class SchoolMateRepositoryTest {

// @Autowired
// private UserRepository userRepository;

// @Autowired
// private PasswordEncoder passwordEncoder;

// /**
// * 학생 데이터 삽입 테스트
// * - 이미 데이터가 존재하면 중복 키 오류 발생하므로 @Disabled 처리
// */

// @Commit
// @Transactional
// @Test
// public void insertStudentTest() {
// IntStream.rangeClosed(1, 5).forEach(i -> {
// Student student = new Student();
// student.changeEmail("student" + i + "@gmail.com");
// student.changePassword(passwordEncoder.encode("1111"));
// student.changeName("학생" + i);
// student.changeRole(UserRole.STUDENT);
// student.changeStudentNumber("2026" + String.format("%04d", i));
// student.changeGrade(i % 3 + 1); // 1~3학년
// student.changeClassNum(i % 10 + 1); // 1~10반

// userRepository.save(student);
// System.out.println("학생 저장: " + student.getEmail());
// });
// }

// /**
// * 교사 데이터 삽입 테스트
// * - 이미 데이터가 존재하면 중복 키 오류 발생하므로 @Disabled 처리
// */

// @Commit
// @Transactional
// @Test
// public void insertTeacherTest() {
// IntStream.rangeClosed(1, 3).forEach(i -> {
// Teacher teacher = new Teacher();
// teacher.changeEmail("teacher" + i + "@gmail.com");
// teacher.changePassword(passwordEncoder.encode("1111"));
// teacher.changeName("선생님" + i);
// teacher.changeRole(UserRole.TEACHER);
// teacher.changeEmployeeNumber("T2024" + String.format("%03d", i));

// String[] subjects = { "수학", "영어", "과학" };
// teacher.changeSubject(subjects[i - 1]);

// userRepository.save(teacher);
// System.out.println("교사 저장: " + teacher.getEmail());
// });
// }

// @Commit
// @Transactional
// @Test
// public void insertParentTest() {
// IntStream.rangeClosed(1, 3).forEach(i -> {
// Parent parent = new Parent();
// parent.changeEmail("parent" + i + "@gmail.com");
// parent.changePassword(passwordEncoder.encode("1111"));
// parent.changeName("학부모" + i);
// parent.changeRole(UserRole.PARENT);
// parent.setPhoneNumber("010-1234-000" + i);

// userRepository.save(parent);
// System.out.println("학부모 저장: " + parent.getEmail());
// });
// }

// /**
// * 관리자 데이터 삽입 테스트
// * - 이미 데이터가 존재하면 중복 키 오류 발생하므로 @Disabled 처리
// */

// @Commit
// @Transactional
// @Test
// public void insertAdminTest() {
// AdminEntity admin = new AdminEntity();
// admin.changeEmail("admin@gmail.com");
// admin.changePassword(passwordEncoder.encode("1111"));
// admin.changeName("관리자");
// admin.changeRole(UserRole.ADMIN);
// admin.changeDepartment("행정실");
// admin.changeEmployeeNumber("A2024001");

// userRepository.save(admin);
// System.out.println("관리자 저장: " + admin.getEmail());
// }

// /**
// * 이메일로 사용자 찾기 테스트
// */
// @Test
// public void findByEmailTest() {
// String email = "student1@gmail.com"; // 실제 저장된 이메일
// Optional<User> result = userRepository.findByEmail(email);

// assertThat(result).isPresent();
// result.ifPresent(user -> {
// System.out.println("===== 사용자 정보 =====");
// System.out.println("UID: " + user.getUid());
// System.out.println("Email: " + user.getEmail());
// System.out.println("Name: " + user.getName());
// System.out.println("Role: " + user.getRole());

// if (user instanceof Student) {
// Student student = (Student) user;
// System.out.println("학번: " + student.getStudentNumber());
// System.out.println("학년: " + student.getGrade());
// System.out.println("반: " + student.getClassNum());
// } else if (user instanceof Teacher) {
// Teacher teacher = (Teacher) user;
// System.out.println("사번: " + teacher.getEmployeeNumber());
// System.out.println("과목: " + teacher.getSubject());
// } else if (user instanceof AdminEntity) {
// AdminEntity admin = (AdminEntity) user;
// System.out.println("사번: " + admin.getEmployeeNumber());
// System.out.println("부서: " + admin.getDepartment());
// }
// });
// }

// // /**
// // * 로그인 실패 테스트 - 잘못된 비밀번호
// // */
// // @Test
// // public void loginFailTest() {
// // String email = "student1@gmail.com"; // 실제 저장된 이메일
// // String wrongPassword = "wrongpassword";

// // Optional<User> result = userRepository.findByEmail(email);

// // assertThat(result).isPresent();

// // result.ifPresent(user -> {
// // boolean matches = passwordEncoder.matches(wrongPassword,
// user.getPassword());

// // System.out.println("===== 로그인 실패 테스트 =====");
// // System.out.println("이메일: " + email);
// // System.out.println("비밀번호 일치: " + matches);

// // assertThat(matches).isFalse();
// // });
// // }

// // /**
// // * 존재하지 않는 이메일로 로그인 시도
// // */
// // @Test
// // public void loginWithNonExistentEmailTest() {
// // String email = "nonexistent@school.com";

// // Optional<User> result = userRepository.findByEmail(email);

// // System.out.println("===== 존재하지 않는 이메일 테스트 =====");
// // System.out.println("이메일: " + email);
// // System.out.println("사용자 존재: " + result.isPresent());

// // assertThat(result).isEmpty();
// // }

// // /**
// // * 이메일 존재 여부 확인 테스트
// // */
// // @Test
// // public void existsByEmailTest() {
// // String existingEmail = "student1@gmail.com"; // 실제 저장된 이메일
// // String nonExistingEmail = "notfound@gmail.com";

// // boolean exists1 = userRepository.existsByEmail(existingEmail);
// // boolean exists2 = userRepository.existsByEmail(nonExistingEmail);

// // System.out.println("===== 이메일 존재 여부 테스트 =====");
// // System.out.println(existingEmail + " 존재: " + exists1);
// // System.out.println(nonExistingEmail + " 존재: " + exists2);

// // assertThat(exists1).isTrue();
// // assertThat(exists2).isFalse();
// // }

// /**
// * 모든 사용자 조회 테스트
// */
// @Test
// public void findAllUsersTest() {
// var users = userRepository.findAll();

// System.out.println("===== 전체 사용자 목록 =====");
// System.out.println("총 사용자 수: " + users.size());

// users.forEach(user -> {
// System.out.println("---");
// System.out.println("ID: " + user.getUid());
// System.out.println("Email: " + user.getEmail());
// System.out.println("Name: " + user.getName());
// System.out.println("Role: " + user.getRole());
// System.out.println("Type: " + user.getClass().getSimpleName());
// });

// assertThat(users).isNotEmpty();
// }
// }

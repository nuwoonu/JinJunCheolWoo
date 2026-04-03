package com.example.schoolmate.admin.service;

import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.SystemSettings;
import com.example.schoolmate.common.entity.constant.ClassroomStatus;
import com.example.schoolmate.common.entity.info.*;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.*;
import com.example.schoolmate.common.entity.user.RoleRequest;
import com.example.schoolmate.common.entity.user.SchoolAdminGrant;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.Gender;
import com.example.schoolmate.common.entity.user.constant.GrantedRole;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.*;
import com.example.schoolmate.common.repository.info.FamilyRelationRepository;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.common.repository.info.parent.ParentInfoRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.repository.info.staff.StaffInfoRepository;
import com.example.schoolmate.common.service.CodeSequenceService;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

/**
 * 테스트 데이터 시딩 서비스
 *
 * testMode=true 일 때만 사용 가능.
 * 테스트1학교(초등) / 테스트2학교(중등) 에 각각:
 *  - 학기 1개 (해당 연도 3/1 ~ 다음해 2/28)
 *  - 학급 10개 (초: 1~2학년 각 3반, 3학년 4반 / 중: 1~3학년 각 3반, 4반)
 *  - 학생 20명, 교사 10명, 교직원 5명
 *  - 학교 관리자(SCHOOL_ADMIN) 1명 필수 포함
 *  - 교사/교직원에 랜덤 GrantedRole 부여
 *  - 학부모 20명 (두 학교 학생을 자녀로 연결)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TestDataService {

    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StaffInfoRepository staffInfoRepository;
    private final ParentInfoRepository parentInfoRepository;
    private final ClassroomRepository classroomRepository;
    private final AcademicTermRepository academicTermRepository;
    private final RoleRequestRepository roleRequestRepository;
    private final SchoolAdminGrantRepository schoolAdminGrantRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final CodeSequenceService codeSequenceService;
    private final PasswordEncoder passwordEncoder;
    private final SystemSettingsRepository systemSettingsRepository;

    // ── 랜덤 데이터 풀 ────────────────────────────────────────────────────────

    private static final String[] LAST_NAMES = {
        "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
        "한", "오", "서", "신", "권", "황", "안", "송", "류", "홍"
    };
    private static final String[] MALE_NAMES = {
        "민준", "서준", "도윤", "예준", "시우", "주원", "하준", "지호", "지후", "준서",
        "준우", "현우", "도현", "지훈", "건우", "우진", "선우", "서진", "한결", "민재"
    };
    private static final String[] FEMALE_NAMES = {
        "서연", "서윤", "지우", "서현", "민서", "하은", "하윤", "윤서", "지민", "채원",
        "수아", "아인", "예린", "다은", "예은", "지아", "소윤", "나은", "가은", "연서"
    };
    private static final String[] DEPARTMENTS = {
        "교무부", "학생부", "연구부", "진로부", "행정실", "시설관리팀"
    };
    private static final String[] POSITIONS = {
        "부장", "평교사", "수석교사", "기간제교사"
    };
    private static final String[] JOB_TITLES = {
        "행정실장", "주무관", "교육행정사", "전산담당", "시설담당", "급식담당"
    };
    private static final String[] ADDRESSES = {
        "서울특별시 강남구 테헤란로 123",
        "서울특별시 서초구 반포대로 456",
        "경기도 수원시 팔달구 효원로 789",
        "경기도 성남시 분당구 판교로 321",
        "부산광역시 해운대구 해운대로 654",
        "대구광역시 중구 달구벌대로 987",
        "인천광역시 남동구 남동대로 147",
        "광주광역시 북구 무등로 258"
    };
    private static final GrantedRole[] TEACHER_GRANTS = {
        GrantedRole.NOTICE_MANAGER, GrantedRole.CLASS_MANAGER,
        GrantedRole.SCHEDULE_MANAGER, GrantedRole.STUDENT_MANAGER
    };
    private static final GrantedRole[] STAFF_GRANTS = {
        GrantedRole.FACILITY_MANAGER, GrantedRole.ASSET_MANAGER,
        GrantedRole.DORMITORY_MANAGER, GrantedRole.PARENT_MANAGER,
        GrantedRole.STAFF_MANAGER, GrantedRole.TEACHER_MANAGER
    };

    private final Random rng = new Random(42); // 고정 시드로 재현 가능

    // ── 퍼블릭 API ────────────────────────────────────────────────────────────

    /** testMode 활성화 여부 확인 */
    @Transactional(readOnly = true)
    public boolean isTestMode() {
        return systemSettingsRepository.findById(1L)
                .map(SystemSettings::isTestMode)
                .orElse(false);
    }

    /** testMode 토글 */
    public boolean toggleTestMode() {
        SystemSettings settings = systemSettingsRepository.findById(1L)
                .orElseGet(() -> {
                    SystemSettings s = new SystemSettings();
                    return s;
                });
        settings.setTestMode(!settings.isTestMode());
        systemSettingsRepository.save(settings);
        return settings.isTestMode();
    }

    /**
     * 테스트 데이터 전체 생성
     * @return 생성 결과 요약 메시지
     */
    public Map<String, Object> seedAll() {
        if (!isTestMode()) {
            throw new IllegalStateException("테스트 모드가 비활성화 상태입니다.");
        }

        int year = LocalDate.now().getYear();
        Map<String, Object> summary = new LinkedHashMap<>();

        // 테스트 전용 학교 조회 또는 생성
        School elemSchool = findOrCreateTestSchool("테스트1학교", "TEST_SCHOOL_001", "초등학교");
        School midSchool  = findOrCreateTestSchool("테스트2학교", "TEST_SCHOOL_002", "중학교");

        summary.put("schools", List.of(elemSchool.getName(), midSchool.getName()));

        // 학기 생성
        seedTerm(elemSchool, year);
        seedTerm(midSchool,  year);
        summary.put("terms", year + "학년도 1학기 (3/1 ~ 다음해 2/28)");

        // 학급 생성 (초: 3학년까지 각 3반 + 나머지 1반 총 10개 / 중: 3학년 각 3반 + 1반 총 10개)
        List<Classroom> elemClasses = seedClassrooms(elemSchool, year, new int[][]{{1,3},{2,3},{3,4}});
        List<Classroom> midClasses  = seedClassrooms(midSchool,  year, new int[][]{{1,3},{2,3},{3,4}});
        summary.put("classrooms", Map.of(
            elemSchool.getName(), elemClasses.size(),
            midSchool.getName(),  midClasses.size()
        ));

        // 교사 생성 (10명, 첫 번째가 SCHOOL_ADMIN)
        List<TeacherInfo> elemTeachers = seedTeachers(elemSchool, elemClasses, 10, year);
        List<TeacherInfo> midTeachers  = seedTeachers(midSchool,  midClasses,  10, year);

        // 교직원 생성 (5명)
        List<StaffInfo> elemStaffs = seedStaffs(elemSchool, 5);
        List<StaffInfo> midStaffs  = seedStaffs(midSchool,  5);

        // 학생 생성 (20명)
        List<StudentInfo> elemStudents = seedStudents(elemSchool, elemClasses, 20, year);
        List<StudentInfo> midStudents  = seedStudents(midSchool,  midClasses,  20, year);

        summary.put("teachers",  Map.of(elemSchool.getName(), elemTeachers.size(), midSchool.getName(), midTeachers.size()));
        summary.put("staffs",    Map.of(elemSchool.getName(), elemStaffs.size(),   midSchool.getName(), midStaffs.size()));
        summary.put("students",  Map.of(elemSchool.getName(), elemStudents.size(), midSchool.getName(), midStudents.size()));

        // 학부모 생성 (20명 — 두 학교 학생을 자녀로)
        List<StudentInfo> allStudents = new ArrayList<>();
        allStudents.addAll(elemStudents);
        allStudents.addAll(midStudents);
        int parents = seedParents(allStudents, 20);
        summary.put("parents", parents);

        log.info("[TestDataService] 테스트 데이터 생성 완료: {}", summary);
        return summary;
    }

    // ── 내부 헬퍼 ─────────────────────────────────────────────────────────────

    private School findOrCreateTestSchool(String name, String code, String kind) {
        return schoolRepository.findBySchoolCode(code).orElseGet(() -> {
            School s = School.builder()
                    .name(name)
                    .schoolCode(code)
                    .schoolKind(kind)
                    .officeOfEducation("테스트 교육청")
                    .officeCode("TEST_OFFICE")
                    .foundationType("공립")
                    .coeduType("남녀공학")
                    .address("서울특별시 테스트구 테스트로 1")
                    .phoneNumber("02-000-0000")
                    .build();
            return schoolRepository.save(s);
        });
    }

    private void seedTerm(School school, int year) {
        // 이미 해당 학교의 ACTIVE 학기가 있으면 스킵
        if (academicTermRepository.findBySchoolIdAndStatus(school.getId(), AcademicTermStatus.ACTIVE).isPresent()) {
            return;
        }
        AcademicTerm term = AcademicTerm.builder()
                .schoolYear(year)
                .semester(1)
                .startDate(LocalDate.of(year, 3, 1))
                .endDate(LocalDate.of(year + 1, 2, 28))
                .status(AcademicTermStatus.ACTIVE)
                .build();
        term.setSchool(school);
        academicTermRepository.save(term);
    }

    /**
     * @param gradeConfig int[학년][반수] 배열 — e.g. {{1,3},{2,3},{3,4}}
     */
    private List<Classroom> seedClassrooms(School school, int year, int[][] gradeConfig) {
        List<Classroom> result = new ArrayList<>();
        for (int[] gc : gradeConfig) {
            int grade = gc[0], count = gc[1];
            for (int cn = 1; cn <= count; cn++) {
                if (classroomRepository.existsByYearAndGradeAndClassNumAndSchool_Id(year, grade, cn, school.getId())) {
                    classroomRepository.findBySchoolIdAndYearAndGradeAndClassNum(school.getId(), year, grade, cn)
                            .ifPresent(result::add);
                    continue;
                }
                Classroom c = Classroom.builder()
                        .year(year)
                        .grade(grade)
                        .classNum(cn)
                        .status(ClassroomStatus.ACTIVE)
                        .build();
                c.setSchool(school);
                result.add(classroomRepository.save(c));
            }
        }
        return result;
    }

    private List<TeacherInfo> seedTeachers(School school, List<Classroom> classrooms, int count, int year) {
        List<TeacherInfo> result = new ArrayList<>();
        boolean schoolAdminCreated = false;

        for (int i = 0; i < count; i++) {
            String email = "teacher" + i + "_" + school.getId() + "@test.com";
            if (userRepository.existsByEmail(email)) continue;

            Gender gender = (i % 2 == 0) ? Gender.MALE : Gender.FEMALE;
            String name = randomName(gender);

            User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of(UserRole.TEACHER)))
                    .build();

            TeacherInfo info = new TeacherInfo();
            info.setCode(codeSequenceService.issue(school.getId(), "T"));
            info.setStatus(TeacherStatus.EMPLOYED);
            info.setPrimary(true);
            info.setUser(user);
            info.setSchool(school);
            info.setDepartment(DEPARTMENTS[i % DEPARTMENTS.length]);
            info.setPosition(POSITIONS[i % POSITIONS.length]);
            info.setPhone("010-" + String.format("%04d", rng.nextInt(10000)) + "-" + String.format("%04d", rng.nextInt(10000)));
            info.setAddress(ADDRESSES[i % ADDRESSES.length]);
            info.setAddressDetail(i + "층");
            info.setBirthDate(LocalDate.of(1975 + (i % 20), 1 + (i % 12), 1 + (i % 28)));
            info.setGender(gender);

            user.getInfos().add(info);
            userRepository.save(user);
            roleRequestRepository.save(RoleRequest.createActive(user, UserRole.TEACHER, school.getId(), null));

            // 담임 배정 (학급 수만큼)
            if (i < classrooms.size()) {
                Classroom c = classrooms.get(i);
                c.setHomeroomTeacher(info);
                c.setTeacher(user);
                classroomRepository.save(c);
            }

            // 첫 번째 교사는 SCHOOL_ADMIN 필수
            if (!schoolAdminCreated) {
                grantRole(user, school, GrantedRole.SCHOOL_ADMIN);
                schoolAdminCreated = true;
            } else if (i < TEACHER_GRANTS.length + 1) {
                // 나머지 일부에게 랜덤 grant
                grantRole(user, school, TEACHER_GRANTS[(i - 1) % TEACHER_GRANTS.length]);
            }

            result.add(info);
        }
        return result;
    }

    private List<StaffInfo> seedStaffs(School school, int count) {
        List<StaffInfo> result = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String email = "staff" + i + "_" + school.getId() + "@test.com";
            if (userRepository.existsByEmail(email)) continue;

            Gender gender = (i % 2 == 0) ? Gender.MALE : Gender.FEMALE;
            String name = randomName(gender);

            User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of(UserRole.STAFF)))
                    .build();

            StaffInfo info = new StaffInfo();
            info.setCode(codeSequenceService.issue(school.getId(), "E"));
            info.setStatus(StaffStatus.EMPLOYED);
            info.setPrimary(true);
            info.setUser(user);
            info.setSchool(school);
            info.setJobTitle(JOB_TITLES[i % JOB_TITLES.length]);
            info.setDepartment(DEPARTMENTS[(i + 2) % DEPARTMENTS.length]);
            info.setWorkLocation("행정실");
            info.setExtensionNumber(String.valueOf(100 + i));
            info.setEmploymentType(i == 0 ? EmploymentType.PERMANENT : EmploymentType.INDEFINITE_CONTRACT);
            info.setPhone("010-" + String.format("%04d", rng.nextInt(10000)) + "-" + String.format("%04d", rng.nextInt(10000)));
            info.setAddress(ADDRESSES[(i + 3) % ADDRESSES.length]);
            info.setAddressDetail("행정동 " + (i + 1) + "호");
            info.setBirthDate(LocalDate.of(1980 + (i % 15), 1 + (i % 12), 1 + (i % 28)));
            info.setGender(gender);

            user.getInfos().add(info);
            userRepository.save(user);
            roleRequestRepository.save(RoleRequest.createActive(user, UserRole.STAFF, school.getId(), null));

            // 랜덤 staff grant
            grantRole(user, school, STAFF_GRANTS[i % STAFF_GRANTS.length]);

            result.add(info);
        }
        return result;
    }

    private List<StudentInfo> seedStudents(School school, List<Classroom> classrooms, int count, int year) {
        List<StudentInfo> result = new ArrayList<>();
        // 학급에 순서대로 배분
        int classIdx = 0;
        Map<Long, Integer> attendanceNums = new HashMap<>();

        for (int i = 0; i < count; i++) {
            String email = "student" + i + "_" + school.getId() + "@test.com";
            if (userRepository.existsByEmail(email)) continue;

            Gender gender = (i % 2 == 0) ? Gender.MALE : Gender.FEMALE;
            String name = randomName(gender);

            User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                    .build();

            StudentInfo info = new StudentInfo();
            info.setCode(codeSequenceService.issue(school.getId(), "S"));
            info.setStatus(StudentStatus.ENROLLED);
            info.setPrimary(true);
            info.setUser(user);
            info.setSchool(school);
            info.setPhone("010-" + String.format("%04d", rng.nextInt(10000)) + "-" + String.format("%04d", rng.nextInt(10000)));
            info.setAddress(ADDRESSES[i % ADDRESSES.length]);
            info.setAddressDetail(i + "번지");
            info.setBirthDate(LocalDate.of(2010 + (i % 6), 1 + (i % 12), 1 + (i % 28)));
            info.setGender(gender);
            // 학급 배정
            if (!classrooms.isEmpty()) {
                Classroom c = classrooms.get(classIdx % classrooms.size());
                classIdx++;

                int num = attendanceNums.getOrDefault(c.getCid(), 0) + 1;
                attendanceNums.put(c.getCid(), num);

                StudentAssignment assignment = new StudentAssignment();
                assignment.setStudentInfo(info);
                assignment.setSchoolYear(year);
                assignment.setClassroom(c);
                assignment.setAttendanceNum(num);
                assignment.setBasicHabits("성실하고 예의 바름");
                assignment.setSpecialNotes("특이사항 없음");

                info.getAssignments().add(assignment);
            }

            user.getInfos().add(info);
            userRepository.save(user);
            roleRequestRepository.save(RoleRequest.createActive(user, UserRole.STUDENT, school.getId(), null));

            result.add(info);
        }
        return result;
    }

    private int seedParents(List<StudentInfo> allStudents, int count) {
        int created = 0;
        // 학생 2명당 학부모 1명 배정 (겹치지 않게)
        Collections.shuffle(allStudents, rng);

        for (int i = 0; i < count; i++) {
            String email = "parent" + i + "@test.com";
            if (userRepository.existsByEmail(email)) continue;

            FamilyRelationship rel = (i % 2 == 0) ? FamilyRelationship.FATHER : FamilyRelationship.MOTHER;
            Gender gender = (rel == FamilyRelationship.FATHER) ? Gender.MALE : Gender.FEMALE;
            String name = randomName(gender);

            User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode("Test1234!"))
                    .roles(new HashSet<>(Set.of(UserRole.PARENT)))
                    .build();

            ParentInfo parentInfo = new ParentInfo();
            parentInfo.setCode(codeSequenceService.issue(null, "P"));
            parentInfo.setParentName(name);
            parentInfo.setUser(user);
            parentInfo.setPhone("010-" + String.format("%04d", rng.nextInt(10000)) + "-" + String.format("%04d", rng.nextInt(10000)));
            parentInfo.setAddress(ADDRESSES[i % ADDRESSES.length]);
            parentInfo.setAddressDetail(i + "층");
            parentInfo.setBirthDate(LocalDate.of(1975 + (i % 15), 1 + (i % 12), 1 + (i % 28)));
            parentInfo.setGender(gender);

            user.getInfos().add(parentInfo);
            userRepository.save(user);
            roleRequestRepository.save(RoleRequest.createActive(user, UserRole.PARENT, null, null));

            // 학생 1~2명 자녀로 연결
            int childCount = (i % 3 == 0) ? 2 : 1;
            for (int c = 0; c < childCount; c++) {
                int idx = i * 2 + c;
                if (idx >= allStudents.size()) break;
                StudentInfo student = allStudents.get(idx);

                FamilyRelation relation = new FamilyRelation();
                relation.setParentInfo(parentInfo);
                relation.setStudentInfo(student);
                relation.setRelationship(rel);
                relation.setRepresentative(c == 0);
                // FamilyRelation은 SchoolBaseEntity 상속이지만 school이 nullable이므로 별도 조회 불필요
                parentInfo.getChildrenRelations().add(relation);
                student.getFamilyRelations().add(relation);
            }

            created++;
        }
        return created;
    }

    private void grantRole(User user, School school, GrantedRole role) {
        if (!schoolAdminGrantRepository.existsByUserAndSchool_IdAndGrantedRole(user, school.getId(), role)) {
            schoolAdminGrantRepository.save(new SchoolAdminGrant(user, school, role, null));
        }
    }

    private String randomName(Gender gender) {
        String lastName  = LAST_NAMES[rng.nextInt(LAST_NAMES.length)];
        String firstName = (gender == Gender.MALE)
                ? MALE_NAMES[rng.nextInt(MALE_NAMES.length)]
                : FEMALE_NAMES[rng.nextInt(FEMALE_NAMES.length)];
        return lastName + firstName;
    }
}

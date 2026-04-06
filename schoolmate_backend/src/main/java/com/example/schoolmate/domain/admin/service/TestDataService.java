package com.example.schoolmate.domain.admin.service;

import com.example.schoolmate.domain.board.entity.Board;
import com.example.schoolmate.domain.board.entity.BoardType;
import com.example.schoolmate.domain.board.repository.BoardRepository;
import com.example.schoolmate.domain.calendar.entity.SchoolCalendar;
import com.example.schoolmate.domain.calendar.entity.constant.EventType;
import com.example.schoolmate.domain.calendar.repository.SchoolCalendarRepository;
import com.example.schoolmate.domain.classgoal.entity.ClassGoal;
import com.example.schoolmate.domain.resources.constant.AssetStatus;
import com.example.schoolmate.domain.resources.constant.FacilityStatus;
import com.example.schoolmate.domain.resources.constant.FacilityType;
import com.example.schoolmate.domain.resources.entity.AssetModel;
import com.example.schoolmate.domain.resources.entity.SchoolAsset;
import com.example.schoolmate.domain.resources.entity.SchoolFacility;
import com.example.schoolmate.domain.resources.repository.AssetModelRepository;
import com.example.schoolmate.domain.resources.repository.SchoolAssetRepository;
import com.example.schoolmate.domain.resources.repository.SchoolFacilityRepository;
import com.example.schoolmate.domain.classgoal.repository.ClassGoalRepository;
import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.classroom.entity.constant.ClassroomStatus;
import com.example.schoolmate.domain.classroom.repository.ClassroomRepository;
import com.example.schoolmate.domain.dormitory.repository.DormitoryRepository;
import com.example.schoolmate.domain.dormitory.service.DormitoryService;
import com.example.schoolmate.domain.grade.entity.Subject;
import com.example.schoolmate.domain.grade.repository.SubjectRepository;
import com.example.schoolmate.domain.parent.entity.FamilyRelation;
import com.example.schoolmate.domain.parent.entity.ParentInfo;
import com.example.schoolmate.domain.parent.entity.constant.FamilyRelationship;
import com.example.schoolmate.domain.parent.repository.FamilyRelationRepository;
import com.example.schoolmate.domain.parent.repository.ParentInfoRepository;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.entity.SystemSettings;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.example.schoolmate.domain.school.repository.SystemSettingsRepository;
import com.example.schoolmate.domain.school.service.CodeSequenceService;
import com.example.schoolmate.domain.staff.entity.StaffInfo;
import com.example.schoolmate.domain.staff.entity.constant.EmploymentType;
import com.example.schoolmate.domain.staff.entity.constant.StaffStatus;
import com.example.schoolmate.domain.staff.repository.StaffInfoRepository;
import com.example.schoolmate.domain.student.entity.StudentAssignment;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.entity.constant.StudentStatus;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.teacher.entity.constant.TeacherStatus;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.term.entity.AcademicTerm;
import com.example.schoolmate.domain.term.entity.AcademicTermStatus;
import com.example.schoolmate.domain.term.entity.SchoolYear;
import com.example.schoolmate.domain.term.entity.SchoolYearStatus;
import com.example.schoolmate.domain.term.repository.AcademicTermRepository;
import com.example.schoolmate.domain.term.repository.SchoolYearRepository;
import com.example.schoolmate.domain.user.entity.RoleRequest;
import com.example.schoolmate.domain.user.entity.SchoolAdminGrant;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.Gender;
import com.example.schoolmate.domain.user.entity.constant.GrantedRole;
import com.example.schoolmate.domain.user.entity.constant.UserRole;
import com.example.schoolmate.domain.user.repository.RoleRequestRepository;
import com.example.schoolmate.domain.user.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
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
 * 발표용 데이터 세팅:
 * - 가거도초등학교 (id=9520): 1~6학년 각 2반 (12학급), 학생 24명, 교사 12명, 교직원 5명
 * - 가경중학교 (id=7487): 1~3학년 각 3반 (9학급), 학생 27명, 교사 10명, 교직원 5명
 * - 학사 일정, 교과목, 공지사항, 알림장, 학급 목표까지 대시보드에 보일 데이터 포함
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TestDataService {

        // ── 기존 레포지토리 ────────────────────────────────────────────────────────
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
        private final SchoolYearRepository schoolYearRepository;
        private final DormitoryService dormitoryService;
        private final DormitoryRepository dormitoryRepository;

        // ── 추가 레포지토리 ────────────────────────────────────────────────────────
        private final SubjectRepository subjectRepository;
        private final SchoolCalendarRepository calendarRepository;
        private final BoardRepository boardRepository;
        private final ClassGoalRepository classGoalRepository;
        private final SchoolFacilityRepository facilityRepository;
        private final SchoolAssetRepository assetRepository;
        private final AssetModelRepository assetModelRepository;

        // ── 학교 ID 상수 ──────────────────────────────────────────────────────────
        private static final long ELEM_SCHOOL_ID = 9520L; // 가거도초등학교
        private static final long MID_SCHOOL_ID = 7487L; // 가경중학교

        // ── 교과목 풀 ─────────────────────────────────────────────────────────────
        private static final String[][] ELEM_SUBJECTS = {
                        { "KOR01", "국어" }, { "MATH01", "수학" }, { "SOC01", "사회" },
                        { "SCI01", "과학" }, { "ENG01", "영어" }, { "MORAL01", "도덕" },
                        { "MUS01", "음악" }, { "ART01", "미술" }, { "PE01", "체육" },
                        { "PRAC01", "실과" }
        };
        private static final String[][] MID_SUBJECTS = {
                        { "KOR02", "국어" }, { "MATH02", "수학" }, { "ENG02", "영어" },
                        { "SOC02", "사회" }, { "HIST02", "역사" }, { "SCI02", "과학" },
                        { "TH02", "기술가정" }, { "INFO02", "정보" }, { "MUS02", "음악" },
                        { "ART02", "미술" }, { "PE02", "체육" }, { "MORAL02", "도덕" }
        };

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
                        "서울특별시 강남구 테헤란로 123", "서울특별시 서초구 반포대로 456",
                        "경기도 수원시 팔달구 효원로 789", "경기도 성남시 분당구 판교로 321",
                        "부산광역시 해운대구 해운대로 654", "대구광역시 중구 달구벌대로 987",
                        "인천광역시 남동구 남동대로 147", "광주광역시 북구 무등로 258"
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

        private final Random rng = new Random(42);

        // ── 퍼블릭 API ────────────────────────────────────────────────────────────

        @Transactional(readOnly = true)
        public boolean isTestMode() {
                return systemSettingsRepository.findById(1L)
                                .map(SystemSettings::isTestMode)
                                .orElse(false);
        }

        public boolean toggleTestMode() {
                SystemSettings settings = systemSettingsRepository.findById(1L)
                                .orElseGet(SystemSettings::new);
                settings.setTestMode(!settings.isTestMode());
                systemSettingsRepository.save(settings);
                return settings.isTestMode();
        }

        public Map<String, Object> seedAll() {
                if (!isTestMode()) {
                        throw new IllegalStateException("테스트 모드가 비활성화 상태입니다.");
                }

                int year = LocalDate.now().getYear();
                Map<String, Object> summary = new LinkedHashMap<>();

                // ── 학교 조회 (기존 실제 학교 사용) ──────────────────────────────────
                School elemSchool = schoolRepository.findById(ELEM_SCHOOL_ID)
                                .orElseThrow(() -> new IllegalStateException(
                                                "가거도초등학교(id=" + ELEM_SCHOOL_ID
                                                                + ")를 DB에서 찾을 수 없습니다. 학교 데이터를 먼저 확인하세요."));
                School midSchool = schoolRepository.findById(MID_SCHOOL_ID)
                                .orElseThrow(() -> new IllegalStateException(
                                                "가경중학교(id=" + MID_SCHOOL_ID + ")를 DB에서 찾을 수 없습니다. 학교 데이터를 먼저 확인하세요."));

                summary.put("schools", List.of(elemSchool.getName(), midSchool.getName()));

                // ── SchoolYear ────────────────────────────────────────────────────────
                SchoolYear elemSy = findOrCreateSchoolYear(elemSchool, year);
                SchoolYear midSy = findOrCreateSchoolYear(midSchool, year);

                // ── 학기 ─────────────────────────────────────────────────────────────
                seedTerm(elemSchool, year, elemSy);
                seedTerm(midSchool, year, midSy);
                summary.put("terms", year + "학년도 1학기 (3/1~다음해 2/28)");

                // ── 학급 (초: 1~6학년 2반, 중: 1~3학년 3반) ─────────────────────────
                List<Classroom> elemClasses = seedClassrooms(elemSchool, elemSy,
                                new int[][] { { 1, 2 }, { 2, 2 }, { 3, 2 }, { 4, 2 }, { 5, 2 }, { 6, 2 } });
                List<Classroom> midClasses = seedClassrooms(midSchool, midSy,
                                new int[][] { { 1, 3 }, { 2, 3 }, { 3, 3 } });
                summary.put("classrooms", Map.of(
                                elemSchool.getName(), elemClasses.size(),
                                midSchool.getName(), midClasses.size()));

                // ── 교과목 ───────────────────────────────────────────────────────────
                int elemSubjectCount = seedSubjects(elemSchool, ELEM_SUBJECTS);
                int midSubjectCount = seedSubjects(midSchool, MID_SUBJECTS);
                summary.put("subjects", Map.of(
                                elemSchool.getName(), elemSubjectCount,
                                midSchool.getName(), midSubjectCount));

                // ── 교사 (초: 12명, 중: 10명) ─────────────────────────────────────────
                List<TeacherInfo> elemTeachers = seedTeachers(elemSchool, elemClasses, 12, year);
                List<TeacherInfo> midTeachers = seedTeachers(midSchool, midClasses, 10, year);

                // ── 교직원 (각 5명) ───────────────────────────────────────────────────
                List<StaffInfo> elemStaffs = seedStaffs(elemSchool, 5);
                List<StaffInfo> midStaffs = seedStaffs(midSchool, 5);

                // ── 학생 (초: 24명, 중: 27명) ─────────────────────────────────────────
                List<StudentInfo> elemStudents = seedStudents(elemSchool, elemClasses, 24, elemSy);
                List<StudentInfo> midStudents = seedStudents(midSchool, midClasses, 27, midSy);

                summary.put("teachers",
                                Map.of(elemSchool.getName(), elemTeachers.size(), midSchool.getName(),
                                                midTeachers.size()));
                summary.put("staffs",
                                Map.of(elemSchool.getName(), elemStaffs.size(), midSchool.getName(), midStaffs.size()));
                summary.put("students",
                                Map.of(elemSchool.getName(), elemStudents.size(), midSchool.getName(),
                                                midStudents.size()));

                // ── 학부모 (25명) ────────────────────────────────────────────────────
                List<StudentInfo> allStudents = new ArrayList<>(elemStudents);
                allStudents.addAll(midStudents);
                int parents = seedParents(allStudents, 25);
                summary.put("parents", parents);

                // ── 학사 일정 ─────────────────────────────────────────────────────────
                seedCalendar(elemSchool, year);
                seedCalendar(midSchool, year);
                summary.put("calendar", "학사일정·시험·방학·행사 " + year + "학년도 일정 등록");

                // ── 공지사항 & 알림장 ─────────────────────────────────────────────────
                if (!elemTeachers.isEmpty())
                        seedNotices(elemSchool, elemTeachers.get(0).getUser(), elemClasses, elemTeachers);
                if (!midTeachers.isEmpty())
                        seedNotices(midSchool, midTeachers.get(0).getUser(), midClasses, midTeachers);
                summary.put("notices", "학교공지 3건·알림장 각 학급 1건 등록");

                // ── 학급 목표 ─────────────────────────────────────────────────────────
                seedClassGoals(elemClasses, year);
                seedClassGoals(midClasses, year);
                summary.put("classGoals", "각 학급 이달의 목표 등록");

                // ── 시설 & 기자재 ─────────────────────────────────────────────────────
                seedFacilities(elemSchool);
                seedFacilities(midSchool);
                summary.put("facilities", "각 학교 시설 10종 등록");

                seedAssets(elemSchool);
                seedAssets(midSchool);
                summary.put("assets", "각 학교 기자재 모델 5종·자산 46건 등록");

                // ── 기숙사 ───────────────────────────────────────────────────────────
                seedDormitories(elemSchool);
                seedDormitories(midSchool);
                summary.put("dormitories", "각 학교 1~3동 기숙사 생성");

                log.info("[TestDataService] 발표용 데이터 생성 완료: {}", summary);
                return summary;
        }

        // ── 내부 헬퍼 ─────────────────────────────────────────────────────────────

        private SchoolYear findOrCreateSchoolYear(School school, int year) {
                return schoolYearRepository.findBySchoolIdAndYear(school.getId(), year)
                                .orElseGet(() -> {
                                        SchoolYear sy = new SchoolYear(year, SchoolYearStatus.CURRENT);
                                        sy.setSchool(school);
                                        return schoolYearRepository.save(sy);
                                });
        }

        private void seedDormitories(School school) {
                if (dormitoryRepository.findBuildingSummaries(school.getId()).isEmpty()) {
                        SchoolContextHolder.setSchoolId(school.getId());
                        try {
                                dormitoryService.initializeDormitories();
                        } finally {
                                SchoolContextHolder.clear();
                        }
                }
        }

        private void seedTerm(School school, int year, SchoolYear sy) {
                if (academicTermRepository.findBySchoolIdAndStatus(school.getId(), AcademicTermStatus.ACTIVE)
                                .isPresent()) {
                        return;
                }
                AcademicTerm term = new AcademicTerm(sy, 1,
                                LocalDate.of(year, 3, 1), LocalDate.of(year + 1, 2, 28), AcademicTermStatus.ACTIVE);
                term.setSchool(school);
                academicTermRepository.save(term);
        }

        private List<Classroom> seedClassrooms(School school, SchoolYear sy, int[][] gradeConfig) {
                List<Classroom> result = new ArrayList<>();
                for (int[] gc : gradeConfig) {
                        int grade = gc[0], count = gc[1];
                        for (int cn = 1; cn <= count; cn++) {
                                if (classroomRepository.existsBySchoolYear_YearAndGradeAndClassNumAndSchool_Id(
                                                sy.getYear(), grade, cn, school.getId())) {
                                        classroomRepository.findBySchoolIdAndSchoolYear_YearAndGradeAndClassNum(
                                                        school.getId(), sy.getYear(), grade, cn).ifPresent(result::add);
                                        continue;
                                }
                                Classroom c = Classroom.builder()
                                                .schoolYear(sy).grade(grade).classNum(cn).status(ClassroomStatus.ACTIVE)
                                                .build();
                                c.setSchool(school);
                                result.add(classroomRepository.save(c));
                        }
                }
                return result;
        }

        private int seedSubjects(School school, String[][] subjectData) {
                int count = 0;
                for (String[] s : subjectData) {
                        if (!subjectRepository.existsByCodeAndSchool_Id(s[0], school.getId())) {
                                Subject subject = Subject.builder().code(s[0]).name(s[1]).build();
                                subject.setSchool(school);
                                subjectRepository.save(subject);
                                count++;
                        }
                }
                return count;
        }

        private void seedCalendar(School school, int year) {
                // 이미 해당 학년도 이벤트가 있으면 스킵
                if (!calendarRepository.findOverlappingEventsBySchool(
                                LocalDate.of(year, 3, 1), LocalDate.of(year, 3, 2), school.getId()).isEmpty()) {
                        return;
                }

                List<SchoolCalendar> events = new ArrayList<>();

                // 1학기
                events.add(buildEvent("입학식 및 개학식", LocalDate.of(year, 3, 2), null, EventType.ACADEMIC, null,
                                "새 학년도 시작"));
                events.add(buildEvent("1학기 중간고사", LocalDate.of(year, 4, 13), LocalDate.of(year, 4, 15), EventType.EXAM,
                                null,
                                "1학기 중간고사 기간"));
                events.add(buildEvent("봄 현장학습", LocalDate.of(year, 4, 25), null, EventType.EVENT, null, "학년별 체험학습"));
                events.add(buildEvent("어린이날", LocalDate.of(year, 5, 5), null, EventType.HOLIDAY, null, null));
                events.add(buildEvent("현충일", LocalDate.of(year, 6, 6), null, EventType.HOLIDAY, null, null));
                events.add(buildEvent("1학기 기말고사", LocalDate.of(year, 6, 22), LocalDate.of(year, 6, 24), EventType.EXAM,
                                null,
                                "1학기 기말고사 기간"));
                events.add(buildEvent("1학기 종업식", LocalDate.of(year, 7, 16), null, EventType.ACADEMIC, null, null));
                events.add(buildEvent("여름방학", LocalDate.of(year, 7, 17), LocalDate.of(year, 8, 16), EventType.VACATION,
                                null,
                                null));

                // 2학기
                events.add(buildEvent("2학기 개학", LocalDate.of(year, 8, 17), null, EventType.ACADEMIC, null, null));
                events.add(buildEvent("2학기 중간고사", LocalDate.of(year, 9, 28), LocalDate.of(year, 9, 30), EventType.EXAM,
                                null,
                                "2학기 중간고사 기간"));
                events.add(buildEvent("추석 연휴", LocalDate.of(year, 10, 2), LocalDate.of(year, 10, 4), EventType.HOLIDAY,
                                null,
                                null));
                events.add(buildEvent("학교 축제", LocalDate.of(year, 10, 16), null, EventType.EVENT, null, "전교생 참여 행사"));
                events.add(buildEvent("가을 현장학습", LocalDate.of(year, 10, 23), null, EventType.EVENT, null, null));
                events.add(buildEvent("2학기 기말고사", LocalDate.of(year, 12, 7), LocalDate.of(year, 12, 9), EventType.EXAM,
                                null,
                                "2학기 기말고사 기간"));
                events.add(buildEvent("2학기 종업식", LocalDate.of(year, 12, 24), null, EventType.ACADEMIC, null, null));
                events.add(buildEvent("겨울방학", LocalDate.of(year, 12, 25), LocalDate.of(year + 1, 2, 9),
                                EventType.VACATION,
                                null, null));
                events.add(buildEvent("졸업식", LocalDate.of(year + 1, 2, 10), null, EventType.ACADEMIC, null, null));

                events.forEach(e -> {
                        e.setSchool(school);
                        calendarRepository.save(e);
                });
        }

        private SchoolCalendar buildEvent(String title, LocalDate start, LocalDate end,
                        EventType type, Integer targetGrade, String desc) {
                return SchoolCalendar.builder()
                                .title(title).startDate(start).endDate(end)
                                .eventType(type).targetGrade(targetGrade).description(desc)
                                .build();
        }

        private void seedNotices(School school, User adminUser,
                        List<Classroom> classrooms, List<TeacherInfo> teachers) {
                // ── 학교 공지사항 (3건) ────────────────────────────────────────────────
                if (!boardRepository.existsBySchool_IdAndBoardTypeAndIsDeleted(
                                school.getId(), BoardType.SCHOOL_NOTICE, false)) {
                        String[][] notices = {
                                        {
                                                        "2026학년도 1학기 학교 운영 계획 안내",
                                                        "<p>안녕하세요. <strong>" + school.getName()
                                                                        + "</strong> 학부모님께 학교 운영 계획을 안내드립니다.</p>" +
                                                                        "<p>1학기 주요 일정 및 학사 운영 방침을 첨부 파일로 공유드립니다. 가정에서도 적극적인 협조 부탁드립니다.</p>"
                                        },
                                        {
                                                        "2026년 학교 현장체험학습 안내",
                                                        "<p>오는 <strong>4월 25일(토)</strong>에 전학년 봄 현장체험학습이 진행됩니다.</p>" +
                                                                        "<ul><li>집합 시간: 오전 8시 30분 운동장</li><li>준비물: 도시락, 물, 여벌 옷</li>"
                                                                        +
                                                                        "<li>귀교 예정: 오후 5시</li></ul>"
                                        },
                                        {
                                                        "학부모 참여 수업 및 상담 주간 안내 (5월)",
                                                        "<p>5월 12일(월) ~ 16일(금) 학부모 참여 수업 및 상담 주간을 운영합니다.</p>" +
                                                                        "<p>SchoolMate 앱을 통해 상담을 예약하시면 담임 선생님과 1:1 상담이 가능합니다.</p>"
                                        }
                        };
                        for (String[] n : notices) {
                                Board board = Board.builder()
                                                .boardType(BoardType.SCHOOL_NOTICE)
                                                .title(n[0]).content(n[1])
                                                .writer(adminUser)
                                                .isImportant(true)
                                                .build();
                                board.setSchool(school);
                                boardRepository.save(board);
                        }
                }

                // ── 알림장 (담임이 배정된 학급마다 1건) ───────────────────────────────
                if (!boardRepository.existsBySchool_IdAndBoardTypeAndIsDeleted(
                                school.getId(), BoardType.CLASS_DIARY, false)) {
                        String[] diaryTitles = {
                                        "이번 주 학급 공지 및 준비물 안내",
                                        "내일 체육 수업 준비물 안내",
                                        "이달의 학급 목표 및 청소 당번 공지",
                                        "다음 주 시험 범위 안내",
                                        "학급 행사 일정 공지"
                        };
                        String[] diaryContents = {
                                        "<p>안녕하세요! 이번 주 주요 공지 사항입니다.</p><ul>" +
                                                        "<li>수요일: 도서관 이용 수업 (책 지참)</li>" +
                                                        "<li>금요일: 학급 청소의 날 (청소 도구 착용)</li>" +
                                                        "<li>숙제: 수학 교과서 p.45~47 풀어오기</li></ul>",

                                        "<p>내일 3교시는 체육 수업입니다. 반드시 <strong>체육복과 운동화</strong>를 준비해 오세요.</p>" +
                                                        "<p>준비물 미지참 시 수업 참여가 어렵습니다.</p>",

                                        "<p><strong>이달의 학급 목표: 서로 존중하고 배려하는 우리 반</strong></p>" +
                                                        "<p>청소 당번은 번호 순으로 돌아가며, 매일 하교 전 10분 청소를 실시합니다.</p>",

                                        "<p>다음 주 목요일 단원 평가가 있습니다. 아래 범위를 복습해 주세요.</p><ul>" +
                                                        "<li>국어: 2단원 전체</li><li>수학: 3단원 곱셈과 나눗셈</li></ul>",

                                        "<p>이번 달 학급 행사 일정을 안내드립니다.</p><ul>" +
                                                        "<li>생일 파티: 이달 생일자 축하 행사 (금요일 점심 시간)</li>" +
                                                        "<li>학급 독서 발표: 각자 읽은 책 소개 (다음 주 화요일)</li></ul>"
                        };

                        int diaryIdx = 0;
                        for (int i = 0; i < teachers.size() && i < classrooms.size(); i++) {
                                Classroom c = classrooms.get(i);
                                // 담임이 배정된 학급만 처리
                                if (c.getTeacher() == null)
                                        continue;
                                Board diary = Board.builder()
                                                .boardType(BoardType.CLASS_DIARY)
                                                .title(diaryTitles[diaryIdx % diaryTitles.length])
                                                .content(diaryContents[diaryIdx % diaryContents.length])
                                                .writer(c.getTeacher())
                                                .targetClassroom(c)
                                                .build();
                                diary.setSchool(school);
                                boardRepository.save(diary);
                                diaryIdx++;
                        }
                }
        }

        private void seedClassGoals(List<Classroom> classrooms, int year) {
                int month = LocalDate.now().getMonthValue();
                String[] goalTexts = {
                                "서로 존중하고 배려하는 우리 반",
                                "꿈을 향해 도전하는 우리 반",
                                "규칙을 지키고 책임감 있는 우리 반",
                                "함께 성장하는 따뜻한 우리 반",
                                "창의적으로 생각하는 우리 반",
                                "건강하고 활기찬 우리 반"
                };
                List<List<String>> actionsList = List.of(
                                List.of("친구에게 먼저 인사하기", "욕설 사용하지 않기", "도움이 필요한 친구 돕기"),
                                List.of("매일 독서 20분", "발표에 적극 참여하기", "숙제 스스로 하기"),
                                List.of("수업 시작 전 착석하기", "쉬는 시간 복도 걷기", "청소 당번 성실히 하기"),
                                List.of("짝과 협력하여 과제 해결하기", "모르는 것은 질문하기", "친구의 의견 경청하기"),
                                List.of("새로운 방법으로 문제 해결하기", "독창적인 아이디어 발표하기", "실수를 두려워하지 않기"),
                                List.of("점심시간 운동장 뛰기", "올바른 식습관 유지하기", "충분한 수면 취하기"));

                for (int i = 0; i < classrooms.size(); i++) {
                        Classroom c = classrooms.get(i);
                        if (classGoalRepository.findByClassroom_CidAndYearAndMonth(c.getCid(), year, month)
                                        .isPresent()) {
                                continue;
                        }
                        int idx = i % goalTexts.length;
                        ClassGoal goal = ClassGoal.builder()
                                        .classroom(c)
                                        .year(year)
                                        .month(month)
                                        .goal(goalTexts[idx])
                                        .actionItems(actionsList.get(idx))
                                        .build();
                        goal.setSchool(c.getSchool());
                        classGoalRepository.save(goal);
                }
        }

        private List<TeacherInfo> seedTeachers(School school, List<Classroom> classrooms, int count, int year) {
                List<TeacherInfo> result = new ArrayList<>();
                boolean schoolAdminCreated = false;

                for (int i = 0; i < count; i++) {
                        String email = "teacher" + i + "_" + school.getId() + "@test.com";
                        if (userRepository.existsByEmail(email))
                                continue;

                        Gender gender = (i % 2 == 0) ? Gender.MALE : Gender.FEMALE;
                        String name = randomName(gender);

                        User user = User.builder()
                                        .name(name).email(email)
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
                        info.setPhone("010-" + String.format("%04d", rng.nextInt(10000)) + "-"
                                        + String.format("%04d", rng.nextInt(10000)));
                        info.setAddress(ADDRESSES[i % ADDRESSES.length]);
                        info.setAddressDetail(i + "층");
                        info.setBirthDate(LocalDate.of(1975 + (i % 20), 1 + (i % 12), 1 + (i % 28)));
                        info.setGender(gender);

                        user.getInfos().add(info);
                        userRepository.save(user);
                        roleRequestRepository
                                        .save(RoleRequest.createActive(user, UserRole.TEACHER, school.getId(), null));

                        // 담임 배정
                        if (i < classrooms.size()) {
                                Classroom c = classrooms.get(i);
                                c.setHomeroomTeacher(info);
                                c.setTeacher(user);
                                classroomRepository.save(c);
                        }

                        if (!schoolAdminCreated) {
                                grantRole(user, school, GrantedRole.SCHOOL_ADMIN);
                                schoolAdminCreated = true;
                        } else if (i < TEACHER_GRANTS.length + 1) {
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
                        if (userRepository.existsByEmail(email))
                                continue;

                        Gender gender = (i % 2 == 0) ? Gender.MALE : Gender.FEMALE;
                        String name = randomName(gender);

                        User user = User.builder()
                                        .name(name).email(email)
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
                        info.setPhone("010-" + String.format("%04d", rng.nextInt(10000)) + "-"
                                        + String.format("%04d", rng.nextInt(10000)));
                        info.setAddress(ADDRESSES[(i + 3) % ADDRESSES.length]);
                        info.setAddressDetail("행정동 " + (i + 1) + "호");
                        info.setBirthDate(LocalDate.of(1980 + (i % 15), 1 + (i % 12), 1 + (i % 28)));
                        info.setGender(gender);

                        user.getInfos().add(info);
                        userRepository.save(user);
                        roleRequestRepository
                                        .save(RoleRequest.createActive(user, UserRole.STAFF, school.getId(), null));
                        grantRole(user, school, STAFF_GRANTS[i % STAFF_GRANTS.length]);

                        result.add(info);
                }
                return result;
        }

        private List<StudentInfo> seedStudents(School school, List<Classroom> classrooms, int count, SchoolYear sy) {
                List<StudentInfo> result = new ArrayList<>();
                int classIdx = 0;
                Map<Long, Integer> attendanceNums = new HashMap<>();

                for (int i = 0; i < count; i++) {
                        String email = "student" + i + "_" + school.getId() + "@test.com";
                        if (userRepository.existsByEmail(email))
                                continue;

                        Gender gender = (i % 2 == 0) ? Gender.MALE : Gender.FEMALE;
                        String name = randomName(gender);

                        User user = User.builder()
                                        .name(name).email(email)
                                        .password(passwordEncoder.encode("Test1234!"))
                                        .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                                        .build();

                        StudentInfo info = new StudentInfo();
                        info.setCode(codeSequenceService.issue(school.getId(), "S"));
                        info.setStatus(StudentStatus.ENROLLED);
                        info.setPrimary(true);
                        info.setUser(user);
                        info.setSchool(school);
                        info.setPhone("010-" + String.format("%04d", rng.nextInt(10000)) + "-"
                                        + String.format("%04d", rng.nextInt(10000)));
                        info.setAddress(ADDRESSES[i % ADDRESSES.length]);
                        info.setAddressDetail(i + "번지");
                        info.setBirthDate(LocalDate.of(2010 + (i % 6), 1 + (i % 12), 1 + (i % 28)));
                        info.setGender(gender);

                        if (!classrooms.isEmpty()) {
                                Classroom c = classrooms.get(classIdx % classrooms.size());
                                classIdx++;
                                int num = attendanceNums.getOrDefault(c.getCid(), 0) + 1;
                                attendanceNums.put(c.getCid(), num);

                                StudentAssignment assignment = new StudentAssignment();
                                assignment.setStudentInfo(info);
                                assignment.setSchoolYear(sy);
                                assignment.setClassroom(c);
                                assignment.setAttendanceNum(num);
                                assignment.setBasicHabits("성실하고 예의 바름");
                                assignment.setSpecialNotes("특이사항 없음");
                                info.getAssignments().add(assignment);
                        }

                        user.getInfos().add(info);
                        userRepository.save(user);
                        roleRequestRepository
                                        .save(RoleRequest.createActive(user, UserRole.STUDENT, school.getId(), null));
                        result.add(info);
                }
                return result;
        }

        private int seedParents(List<StudentInfo> allStudents, int count) {
                int created = 0;
                Collections.shuffle(allStudents, rng);
                for (int i = 0; i < count; i++) {
                        String email = "parent" + i + "@test.com";
                        if (userRepository.existsByEmail(email))
                                continue;

                        FamilyRelationship rel = (i % 2 == 0) ? FamilyRelationship.FATHER : FamilyRelationship.MOTHER;
                        Gender gender = (rel == FamilyRelationship.FATHER) ? Gender.MALE : Gender.FEMALE;
                        String name = randomName(gender);

                        User user = User.builder()
                                        .name(name).email(email)
                                        .password(passwordEncoder.encode("Test1234!"))
                                        .roles(new HashSet<>(Set.of(UserRole.PARENT)))
                                        .build();

                        ParentInfo parentInfo = new ParentInfo();
                        parentInfo.setCode(codeSequenceService.issue(null, "P"));
                        parentInfo.setParentName(name);
                        parentInfo.setUser(user);
                        parentInfo.setPhone("010-" + String.format("%04d", rng.nextInt(10000)) + "-"
                                        + String.format("%04d", rng.nextInt(10000)));
                        parentInfo.setAddress(ADDRESSES[i % ADDRESSES.length]);
                        parentInfo.setAddressDetail(i + "층");
                        parentInfo.setBirthDate(LocalDate.of(1975 + (i % 15), 1 + (i % 12), 1 + (i % 28)));
                        parentInfo.setGender(gender);

                        user.getInfos().add(parentInfo);
                        userRepository.save(user);
                        roleRequestRepository.save(RoleRequest.createActive(user, UserRole.PARENT, null, null));

                        int childCount = (i % 3 == 0) ? 2 : 1;
                        for (int c = 0; c < childCount; c++) {
                                int idx = i * 2 + c;
                                if (idx >= allStudents.size())
                                        break;
                                StudentInfo student = allStudents.get(idx);
                                FamilyRelation relation = new FamilyRelation();
                                relation.setParentInfo(parentInfo);
                                relation.setStudentInfo(student);
                                relation.setRelationship(rel);
                                relation.setRepresentative(c == 0);
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

        private void seedFacilities(School school) {
                if (facilityRepository.existsBySchool_Id(school.getId()))
                        return;

                Object[][] data = {
                                // name, locationDesc, FacilityType, FacilityStatus, capacity, amenities
                                { "과학실", "3층 301호", FacilityType.SPECIAL_ROOM, FacilityStatus.AVAILABLE, 30,
                                                "실험대 15개, 싱크대, 환기시설" },
                                { "컴퓨터실", "3층 302호", FacilityType.COMPUTER_LAB, FacilityStatus.AVAILABLE, 30,
                                                "PC 30대, 빔프로젝터, 화이트보드" },
                                { "강당", "1층", FacilityType.AUDITORIUM, FacilityStatus.AVAILABLE, 300,
                                                "무대, 음향시스템, 냉난방" },
                                { "체육관", "별관 1층", FacilityType.GYM, FacilityStatus.AVAILABLE, 200,
                                                "농구골대, 배드민턴 네트, 스코어보드" },
                                { "음악실", "2층 201호", FacilityType.SPECIAL_ROOM, FacilityStatus.AVAILABLE, 30,
                                                "피아노 1대, 전자피아노 10대, 음향장비" },
                                { "미술실", "2층 202호", FacilityType.SPECIAL_ROOM, FacilityStatus.MAINTENANCE, 30,
                                                "작업대 15개, 세면대, 도예가마 (보수중)" },
                                { "도서관", "2층 203호", FacilityType.ETC, FacilityStatus.AVAILABLE, 50,
                                                "장서 5000권, PC 10대, 열람 좌석 40석" },
                                { "교직원 회의실", "4층 401호", FacilityType.MEETING_ROOM, FacilityStatus.AVAILABLE, 20,
                                                "대형 모니터, 화상회의 장비, 화이트보드" },
                                { "보건실", "1층 102호", FacilityType.ETC, FacilityStatus.AVAILABLE, 10,
                                                "침대 3개, 의약품 보관함, AED" },
                                { "운동장", "본관 앞", FacilityType.PLAYGROUND, FacilityStatus.AVAILABLE, 500,
                                                "축구골대, 농구코트, 트랙 200m" },
                };

                for (Object[] d : data) {
                        SchoolFacility f = SchoolFacility.builder()
                                        .type((FacilityType) d[2])
                                        .status((FacilityStatus) d[3])
                                        .capacity((Integer) d[4])
                                        .amenities((String) d[5])
                                        .build();
                        f.setName((String) d[0]);
                        f.setLocationDesc((String) d[1]);
                        f.setSchool(school);
                        facilityRepository.save(f);
                }
        }

        private void seedAssets(School school) {
                if (!assetModelRepository.findBySchoolId(school.getId()).isEmpty())
                        return;

                // ── 기자재 모델 정의 ──────────────────────────────────────────��──────
                record ModelSpec(String name, String manufacturer, String category, String desc,
                                int available, int inUse, int broken) {
                }

                List<ModelSpec> specs = List.of(
                                new ModelSpec("갤럭시 북 4 Pro", "삼성전자", "노트북", "Intel Core Ultra 7, 16GB RAM, 512GB SSD",
                                                8, 4, 1),
                                new ModelSpec("LG 그램 17", "LG전자", "노트북", "Intel i7 13세대, 16GB RAM, 1TB SSD", 6, 2, 0),
                                new ModelSpec("엡손 EB-X51", "엡손", "빔프로젝터", "3800루멘, XGA, HDMI/VGA", 5, 2, 1),
                                new ModelSpec("갤럭시 탭 A9+", "삼성전자", "태블릿", "11인치, 8GB RAM, 128GB, Wi-Fi", 12, 5, 1),
                                new ModelSpec("캐논 MF453dw", "캐논", "복합기", "흑백 레이저, 자동양면, 네트워크 지원", 2, 0, 1));

                int assetSeq = 1;
                for (ModelSpec spec : specs) {
                        AssetModel model = AssetModel.builder()
                                        .name(spec.name())
                                        .manufacturer(spec.manufacturer())
                                        .category(spec.category())
                                        .description(spec.desc())
                                        .build();
                        model.setSchool(school);
                        assetModelRepository.save(model);

                        // AVAILABLE 자산
                        for (int i = 0; i < spec.available(); i++) {
                                saveAsset(school, model, assetSeq++, AssetStatus.AVAILABLE);
                        }
                        // IN_USE 자산
                        for (int i = 0; i < spec.inUse(); i++) {
                                saveAsset(school, model, assetSeq++, AssetStatus.IN_USE);
                        }
                        // BROKEN 자산
                        for (int i = 0; i < spec.broken(); i++) {
                                saveAsset(school, model, assetSeq++, AssetStatus.BROKEN);
                        }
                }
        }

        private void saveAsset(School school, AssetModel model, int seq, AssetStatus status) {
                String code = String.format("ASSET-%d-%03d", school.getId(), seq);
                if (assetRepository.existsByAssetCodeAndSchool_Id(code, school.getId()))
                        return;

                SchoolAsset asset = SchoolAsset.builder()
                                .assetCode(code)
                                .serialNumber("SN-" + school.getId() + "-" + String.format("%05d", seq))
                                .model(model)
                                .purchaseDate(LocalDate.of(2024, 3, 1).plusMonths(seq % 12))
                                .status(status)
                                .build();
                asset.setSchool(school);
                asset.setName(model.getName());
                asset.setLocationDesc(model.getCategory() + " 보관실");
                assetRepository.save(asset);
        }

        private String randomName(Gender gender) {
                String lastName = LAST_NAMES[rng.nextInt(LAST_NAMES.length)];
                String firstName = (gender == Gender.MALE)
                                ? MALE_NAMES[rng.nextInt(MALE_NAMES.length)]
                                : FEMALE_NAMES[rng.nextInt(FEMALE_NAMES.length)];
                return lastName + firstName;
        }
}

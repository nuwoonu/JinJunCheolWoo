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

import com.example.schoolmate.domain.board.entity.Comment;
import com.example.schoolmate.domain.board.repository.CommentRepository;
import com.example.schoolmate.domain.consultation.entity.ConsultationReservation;
import com.example.schoolmate.domain.consultation.entity.ConsultationType;
import com.example.schoolmate.domain.consultation.entity.ReservationStatus;
import com.example.schoolmate.domain.consultation.repository.ConsultationReservationRepository;
import com.example.schoolmate.domain.dormitory.entity.Dormitory;
import com.example.schoolmate.domain.dormitory.entity.DormitoryAssignment;
import com.example.schoolmate.domain.dormitory.repository.DormitoryAssignmentRepository;
import com.example.schoolmate.domain.grade.entity.Grade;
import com.example.schoolmate.domain.grade.entity.Subject;
import com.example.schoolmate.domain.grade.repository.GradeRepository;
import com.example.schoolmate.domain.homework.entity.Homework;
import com.example.schoolmate.domain.homework.entity.HomeworkStatus;
import com.example.schoolmate.domain.homework.entity.HomeworkSubmission;
import com.example.schoolmate.domain.homework.repository.HomeworkRepository;
import com.example.schoolmate.domain.homework.repository.HomeworkSubmissionRepository;
import com.example.schoolmate.domain.library.entity.Book;
import com.example.schoolmate.domain.library.entity.BookLoan;
import com.example.schoolmate.domain.library.entity.BookReview;
import com.example.schoolmate.domain.library.entity.constant.BookCategory;
import com.example.schoolmate.domain.library.entity.constant.BookLoanStatus;
import com.example.schoolmate.domain.library.repository.BookLoanRepository;
import com.example.schoolmate.domain.library.repository.BookRepository;
import com.example.schoolmate.domain.library.repository.BookReviewRepository;
import com.example.schoolmate.domain.quiz.entity.QuestionType;
import com.example.schoolmate.domain.quiz.entity.Quiz;
import com.example.schoolmate.domain.quiz.entity.QuizAnswer;
import com.example.schoolmate.domain.quiz.entity.QuizOption;
import com.example.schoolmate.domain.quiz.entity.QuizQuestion;
import com.example.schoolmate.domain.quiz.entity.QuizSubmission;
import com.example.schoolmate.domain.quiz.repository.QuizRepository;
import com.example.schoolmate.domain.quiz.repository.QuizSubmissionRepository;
import com.example.schoolmate.domain.studentrecord.awards.entity.AwardsAndHonors;
import com.example.schoolmate.domain.studentrecord.awards.repository.AwardsAndHonorsRepository;
import com.example.schoolmate.domain.studentrecord.behavior.entity.BehaviorRecord;
import com.example.schoolmate.domain.studentrecord.behavior.repository.BehaviorRecordRepository;
import com.example.schoolmate.domain.studentrecord.bookreport.entity.BookReport;
import com.example.schoolmate.domain.studentrecord.bookreport.repository.BookReportRepository;
import com.example.schoolmate.domain.studentrecord.career.entity.CareerAspiration;
import com.example.schoolmate.domain.studentrecord.career.repository.CareerAspirationRepository;
import com.example.schoolmate.domain.studentrecord.cocurricular.entity.CocurricularActivities;
import com.example.schoolmate.domain.studentrecord.cocurricular.repository.CocurricularActivitiesRepository;
import com.example.schoolmate.domain.studentrecord.volunteer.entity.VolunteerActivity;
import com.example.schoolmate.domain.studentrecord.volunteer.repository.VolunteerActivityRepository;
import com.example.schoolmate.domain.servicenotice.entity.ServiceNotice;
import com.example.schoolmate.domain.servicenotice.repository.ServiceNoticeRepository;
import com.example.schoolmate.domain.term.entity.CourseSection;
import com.example.schoolmate.domain.term.repository.CourseSectionRepository;
import com.example.schoolmate.domain.user.entity.constant.AchievementsGrade;
import com.example.schoolmate.domain.user.entity.constant.ActivityCategory;
import com.example.schoolmate.domain.user.entity.constant.TestType;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 테스트 데이터 시딩 서비스
 *
 * 발표용 데이터 세팅:
 * - 가거도초등학교 : 1~6학년 각 2반 (12학급), 학생 24명, 교사 12명, 교직원 5명
 * - 가경중학교 : 1~3학년 각 3반 (9학급), 학생 27명, 교사 10명, 교직원 5명
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

        // ── 확장 레포지토리 (시연용 풍부한 데이터) ──────────────────────────────────
        private final CourseSectionRepository courseSectionRepository;
        private final HomeworkRepository homeworkRepository;
        private final HomeworkSubmissionRepository homeworkSubmissionRepository;
        private final QuizRepository quizRepository;
        private final QuizSubmissionRepository quizSubmissionRepository;
        private final GradeRepository gradeRepository;
        private final BookRepository bookRepository;
        private final BookLoanRepository bookLoanRepository;
        private final BookReviewRepository bookReviewRepository;
        private final DormitoryAssignmentRepository dormitoryAssignmentRepository;
        private final BehaviorRecordRepository behaviorRecordRepository;
        private final AwardsAndHonorsRepository awardsAndHonorsRepository;
        private final VolunteerActivityRepository volunteerActivityRepository;
        private final CareerAspirationRepository careerAspirationRepository;
        private final CocurricularActivitiesRepository cocurricularActivitiesRepository;
        private final BookReportRepository bookReportRepository;
        private final ConsultationReservationRepository consultationReservationRepository;
        private final CommentRepository commentRepository;
        private final ServiceNoticeRepository serviceNoticeRepository;

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
                AcademicTerm elemTerm = seedTerm(elemSchool, year, elemSy);
                AcademicTerm midTerm = seedTerm(midSchool, year, midSy);
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

                // ── 서비스 공지사항 (앱 전체) ─────────────────────────────────────────
                seedServiceNotices();
                summary.put("serviceNotices", "SchoolMate 서비스 공지 5건 등록");

                // ── 기숙사 ───────────────────────────────────────────────────────────
                seedDormitories(elemSchool);
                seedDormitories(midSchool);
                summary.put("dormitories", "각 학교 1~3동 기숙사 생성");

                // ── 분반(CourseSection) ──────────────────────────────────────────────
                List<Subject> elemSubjectList = subjectRepository.findAllBySchool_Id(elemSchool.getId());
                List<Subject> midSubjectList = subjectRepository.findAllBySchool_Id(midSchool.getId());
                List<CourseSection> elemSections = seedCourseSections(elemSchool, elemClasses, elemTeachers, elemTerm, elemSubjectList);
                List<CourseSection> midSections = seedCourseSections(midSchool, midClasses, midTeachers, midTerm, midSubjectList);
                summary.put("courseSections", Map.of(
                                elemSchool.getName(), elemSections.size(),
                                midSchool.getName(), midSections.size()));

                // ── 과제 & 제출 ────────────────────────────────────────────────────
                seedHomework(elemSections, elemStudents, elemSchool);
                seedHomework(midSections, midStudents, midSchool);
                summary.put("homework", "각 학급 핵심 과목 과제·제출 등록");

                // ── 퀴즈 & 제출 ────────────────────────────────────────────────────
                seedQuizzes(elemSections, elemStudents, elemSchool);
                seedQuizzes(midSections, midStudents, midSchool);
                summary.put("quizzes", "각 학급 국어·수학 퀴즈 + 학생 응시 결과 등록");

                // ── 성적 ──────────────────────────────────────────────────────────
                seedGrades(elemStudents, elemSubjectList, elemTerm, elemTeachers, elemSchool);
                seedGrades(midStudents, midSubjectList, midTerm, midTeachers, midSchool);
                summary.put("grades", "학생별 중간·기말고사 성적 등록");

                // ── 도서관 ────────────────────────────────────────────────────────
                seedLibrary(elemSchool, elemStudents);
                seedLibrary(midSchool, midStudents);
                summary.put("library", "각 학교 도서 20권·대출 이력·리뷰 등록");

                // ── 기숙사 입주 ──────────────────────────────────────────────────
                seedDormitoryAssignments(elemSchool, elemStudents, elemTerm);
                seedDormitoryAssignments(midSchool, midStudents, midTerm);
                summary.put("dormitoryAssignments", "학생 기숙사 입주 배정 등록");

                // ── 학생 생활기록부 ────────────────────────────────────────────────
                seedStudentRecords(elemStudents, elemTerm, elemSchool);
                seedStudentRecords(midStudents, midTerm, midSchool);
                summary.put("studentRecords", "행동특성·수상·봉사·진로·체험활동·독서록 등록");

                // ── 상담 예약 ──────────────────────────────────────────────────────
                seedConsultations(elemSchool, elemStudents, year);
                seedConsultations(midSchool, midStudents, year);
                summary.put("consultations", "학부모 상담 예약 등록");

                // ── 학급 게시판 ────────────────────────────────────────────────────
                seedClassBoards(elemSchool, elemClasses, elemTeachers, elemStudents);
                seedClassBoards(midSchool, midClasses, midTeachers, midStudents);
                summary.put("classBoards", "학급 게시판 게시글·댓글 등록");

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

        private AcademicTerm seedTerm(School school, int year, SchoolYear sy) {
                return academicTermRepository.findBySchoolIdAndStatus(school.getId(), AcademicTermStatus.ACTIVE)
                                .orElseGet(() -> {
                                        AcademicTerm term = new AcademicTerm(sy, 1,
                                                        LocalDate.of(year, 3, 1), LocalDate.of(year + 1, 2, 28),
                                                        AcademicTermStatus.ACTIVE);
                                        term.setSchool(school);
                                        return academicTermRepository.save(term);
                                });
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

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 확장 시딩 메서드 — 시연용 풍부한 데이터
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        // ── 분반(CourseSection) ────────────────────────────────────────────────
        private List<CourseSection> seedCourseSections(School school, List<Classroom> classrooms,
                        List<TeacherInfo> teachers, AcademicTerm term, List<Subject> subjects) {
                List<CourseSection> existing = courseSectionRepository.findByTerm(term);
                if (!existing.isEmpty())
                        return existing;

                List<CourseSection> result = new ArrayList<>();
                int teacherCount = teachers.size();
                if (teacherCount == 0 || subjects.isEmpty())
                        return result;

                // 특기 과목 코드 (담임 외 교사가 맡음)
                Set<String> specialCodes = Set.of("PE01", "PE02", "MUS01", "MUS02", "ART01", "ART02",
                                "PRAC01", "INFO02");

                for (int ci = 0; ci < classrooms.size(); ci++) {
                        Classroom classroom = classrooms.get(ci);
                        TeacherInfo homeroom = classroom.getHomeroomTeacher();
                        if (homeroom == null)
                                homeroom = teachers.get(ci % teacherCount);

                        for (int si = 0; si < subjects.size(); si++) {
                                Subject subject = subjects.get(si);
                                TeacherInfo teacher;
                                if (specialCodes.contains(subject.getCode())) {
                                        // 특기 과목은 별도 교사 (homeroom+1+si 번째)
                                        teacher = teachers.get((ci + si + 1) % teacherCount);
                                } else {
                                        teacher = homeroom;
                                }
                                CourseSection section = new CourseSection(term, teacher, subject, classroom);
                                section.setSchool(school);
                                result.add(courseSectionRepository.save(section));
                        }
                }
                return result;
        }

        // ── 과제 & 제출 ────────────────────────────────────────────────────────
        private static final Set<String> CORE_CODES = Set.of(
                        "KOR01", "KOR02", "MATH01", "MATH02", "SCI01", "SCI02",
                        "ENG01", "ENG02", "SOC01", "SOC02", "HIST02");

        private void seedHomework(List<CourseSection> sections, List<StudentInfo> students, School school) {
                if (sections.isEmpty())
                        return;
                if (!homeworkRepository.findBySectionId(sections.get(0).getId()).isEmpty())
                        return;

                String[][][] subjectHW = {
                        // [과목키워드][숫자] = {제목, 내용}
                        { { "국어", "2단원 시 감상문 쓰기",
                                        "<p>교과서 2단원을 읽고 <strong>시 감상문</strong>을 A4 한 페이지 분량으로 작성하세요.</p><ul><li>시의 주제와 분위기를 설명하세요</li><li>인상 깊었던 구절을 인용하세요</li></ul>" },
                                { "국어", "3단원 독서 일기 작성",
                                        "<p>이번 주 읽은 책에 대한 <strong>독서 일기</strong>를 작성하세요.</p><ul><li>줄거리 요약 (5문장 이상)</li><li>느낀 점 및 배운 점</li></ul>" } },
                        { { "수학", "교과서 p.32~34 연습문제",
                                        "<p>수학 교과서 <strong>32~34쪽</strong> 연습문제를 모두 풀어 오세요.</p><p>풀이 과정을 반드시 적어야 합니다.</p>" },
                                { "수학", "단원 정리 문제 풀기",
                                        "<p>이번 단원 정리 문제지를 풀어 제출하세요.</p><ul><li>계산 과정 필기</li><li>오답 노트 작성 (틀린 문제)</li></ul>" } },
                        { { "과학", "3단원 정리 노트 작성",
                                        "<p>3단원 학습 내용을 <strong>정리 노트</strong>로 만들어 오세요.</p><ul><li>핵심 개념 정리</li><li>실험 결과 요약</li></ul>" },
                                { "과학", "관찰 일지 작성",
                                        "<p>이번 주 과학 시간에 관찰한 내용을 <strong>관찰 일지</strong>로 작성하세요.</p><p>그림과 함께 설명을 덧붙이면 좋습니다.</p>" } },
                        { { "영어", "Unit 3 핵심 단어 암기",
                                        "<p>Unit 3의 핵심 단어 <strong>20개</strong>를 암기하고, 각 단어로 문장을 만들어 오세요.</p>" },
                                { "영어", "영어 일기 쓰기",
                                        "<p>오늘 하루를 영어로 일기를 써 보세요. <strong>5문장 이상</strong> 작성해야 합니다.</p>" } },
                        { { "사회", "사회 탐구 보고서 작성",
                                        "<p>우리 지역 사회의 특징을 조사하여 <strong>탐구 보고서</strong>를 작성하세요.</p><ul><li>조사 방법 기재</li><li>사진 또는 자료 첨부</li></ul>" },
                                { "역사", "역사 인물 조사",
                                        "<p>조선시대 대표 인물 중 1명을 선택하여 <strong>인물 소개 보고서</strong>를 작성하세요.</p><ul><li>인물의 업적</li><li>역사적 의의</li></ul>" } },
                };

                String[] feedbacks = {
                        "잘 작성했습니다. 다음에도 이렇게 꼼꼼하게 해오세요.",
                        "핵심 내용을 잘 파악했네요. 조금 더 자세한 설명이 있으면 좋겠습니다.",
                        "노력한 흔적이 보입니다. 다음엔 예시를 더 들어보세요.",
                        "훌륭합니다! 창의적인 생각이 돋보입니다.",
                        "기본은 갖추었습니다. 분량을 조금 더 늘려보세요.",
                };

                LocalDateTime now = LocalDateTime.now();
                int hwIdx = 0;

                for (CourseSection section : sections) {
                        String subjectName = section.getSubject().getName();
                        if (!CORE_CODES.contains(section.getSubject().getCode()))
                                continue;

                        // 과목 유형 인덱스 결정
                        int typeIdx = 0;
                        if (subjectName.equals("수학"))
                                typeIdx = 1;
                        else if (subjectName.equals("과학"))
                                typeIdx = 2;
                        else if (subjectName.equals("영어"))
                                typeIdx = 3;
                        else if (subjectName.equals("사회") || subjectName.equals("역사"))
                                typeIdx = 4;

                        for (int hw = 0; hw < 2; hw++) {
                                String[] tmpl = subjectHW[typeIdx][hw % 2];
                                LocalDateTime due = now.plusDays(7 + hwIdx * 3L);
                                LocalDateTime pastDue = now.minusDays(10 + hwIdx * 2L);

                                Homework homework = Homework.builder()
                                                .title("[" + subjectName + "] " + tmpl[1])
                                                .content(tmpl[2])
                                                .courseSection(section)
                                                .status(hw == 0 ? HomeworkStatus.OPEN : HomeworkStatus.CLOSED)
                                                .dueDate(hw == 0 ? due : pastDue)
                                                .maxScore(100)
                                                .build();
                                homework.setSchool(school);
                                homeworkRepository.save(homework);

                                // 학생 제출 (해당 학급 학생들)
                                List<StudentInfo> classStudents = studentsInClassroom(students,
                                                section.getClassroom());
                                int submittedCount = 0;
                                for (int si = 0; si < classStudents.size(); si++) {
                                        StudentInfo student = classStudents.get(si);
                                        if (rng.nextInt(10) < 2)
                                                continue; // 20% 미제출
                                        boolean graded = hw == 1; // 마감된 과제만 채점
                                        int score = 70 + rng.nextInt(31); // 70~100
                                        LocalDateTime submittedAt = hw == 0
                                                        ? now.minusDays(rng.nextInt(3) + 1)
                                                        : pastDue.minusDays(rng.nextInt(5) + 1);

                                        HomeworkSubmission.SubmissionStatus status = graded
                                                        ? HomeworkSubmission.SubmissionStatus.GRADED
                                                        : HomeworkSubmission.SubmissionStatus.SUBMITTED;

                                        HomeworkSubmission submission = HomeworkSubmission.builder()
                                                        .homework(homework)
                                                        .student(student)
                                                        .content("<p>" + student.getUser().getName() + "의 과제 제출입니다.</p>"
                                                                        + "<p>열심히 작성했습니다. 확인 부탁드립니다.</p>")
                                                        .submittedAt(submittedAt)
                                                        .score(graded ? score : null)
                                                        .feedback(graded ? feedbacks[si % feedbacks.length] : null)
                                                        .status(status)
                                                        .build();
                                        homeworkSubmissionRepository.save(submission);
                                        submittedCount++;
                                }
                                hwIdx++;
                        }
                }
        }

        // ── 퀴즈 & 제출 ────────────────────────────────────────────────────────
        private void seedQuizzes(List<CourseSection> sections, List<StudentInfo> students, School school) {
                if (sections.isEmpty())
                        return;
                if (!quizRepository.findByCourseSection(sections.get(0).getId()).isEmpty())
                        return;

                // 과목별 퀴즈 문제 데이터 [제목, 설명, [문1,답1], [문2,답2], ...]
                Map<String, String[][]> quizData = new LinkedHashMap<>();
                quizData.put("국어", new String[][] {
                        { "1학기 국어 단원평가", "1단원~2단원 범위의 단원평가입니다." },
                        { "다음 중 올바른 맞춤법은?", "①맞추다 ②마추다 ③맞히다 ④마치다", "3" },
                        { "시에서 반복되는 표현 기법의 이름은?", "①은유 ②반복 ③도치 ④대조", "2" },
                        { "다음 문장의 주어는? '철수가 밥을 먹는다'", "①철수가 ②밥을 ③먹는다 ④없다", "1" },
                        { "띄어쓰기가 올바른 것은?", "①한국어 ②한 국어 ③한국 어 ④한 국 어", "1" },
                        { "우리나라 국어의 자음 개수는?", "14", null }, // 단답형
                        { "독서 감상문에서 가장 먼저 쓰는 내용은?", "책 제목과 작가", null }, // 단답형
                });
                quizData.put("수학", new String[][] {
                        { "1학기 수학 단원평가", "3단원~4단원 범위의 단원평가입니다." },
                        { "12 × 7 = ?", "①72 ②84 ③96 ④108", "2" },
                        { "분수 2/3 + 1/3 의 값은?", "①1/3 ②2/3 ③1 ④3/3", "3" },
                        { "직사각형의 둘레를 구하는 공식은?", "①가로+세로 ②(가로+세로)×2 ③가로×세로 ④가로×세로×2", "2" },
                        { "소수 중 짝수인 것은?", "①1 ②2 ③3 ④5", "2" },
                        { "가장 작은 소수는?", "2", null },
                        { "삼각형 내각의 합은 몇 도인가?", "180", null },
                });
                quizData.put("과학", new String[][] {
                        { "1학기 과학 단원평가", "2단원~3단원 범위의 단원평가입니다." },
                        { "물이 끓는 온도(1기압)는?", "①50°C ②80°C ③100°C ④120°C", "3" },
                        { "식물이 빛을 이용해 양분을 만드는 과정은?", "①호흡 ②광합성 ③증산 ④소화", "2" },
                        { "지구에서 달까지의 거리에 가장 가까운 값은?", "①38만km ②38만km ③150만km ④3800만km", "2" },
                        { "산소의 화학 기호는?", "①H ②C ③N ④O", "4" },
                        { "물의 화학식은?", "H2O", null },
                        { "지구의 자전 주기는 약 몇 시간인가?", "24", null },
                });
                quizData.put("영어", new String[][] {
                        { "Unit 3 단어 테스트", "Unit 3 핵심 단어 확인 테스트입니다." },
                        { "What is the capital of Korea?", "①Tokyo ②Seoul ③Beijing ④Bangkok", "2" },
                        { "'사과'의 영어 단어는?", "①Orange ②Grape ③Apple ④Banana", "3" },
                        { "다음 중 복수형이 올바른 것은?", "①childs ②mouses ③children ④leafs", "3" },
                        { "I ___ a student. 빈칸에 알맞은 단어는?", "①am ②is ③are ④be", "1" },
                        { "'행복한'을 영어로 쓰면?", "happy", null },
                        { "영어 알파벳은 모두 몇 개인가?", "26", null },
                });

                LocalDateTime now = LocalDateTime.now();

                for (CourseSection section : sections) {
                        String subjectName = section.getSubject().getName();
                        if (!quizData.containsKey(subjectName))
                                continue;

                        String[][] data = quizData.get(subjectName);
                        String quizTitle = data[0][0];
                        String quizDesc = data[0][1];

                        Quiz quiz = Quiz.builder()
                                        .title("[" + subjectName + "] " + quizTitle)
                                        .description(quizDesc)
                                        .week(rng.nextInt(8) + 1)
                                        .teacher(section.getTeacher())
                                        .classroom(section.getClassroom())
                                        .courseSection(section)
                                        .dueDate(now.plusDays(5 + rng.nextInt(7)))
                                        .status(Quiz.QuizStatus.OPEN)
                                        .maxAttempts(1)
                                        .showAnswer(true)
                                        .build();
                        quiz.setSchool(school);

                        // 객관식 4문제 (data[1]~[4])
                        for (int q = 1; q <= 4 && q < data.length; q++) {
                                String[] row = data[q];
                                String questionText = row[0];
                                String optionsRaw = row.length > 1 ? row[1] : "";
                                int correctOptIdx = row.length > 2 ? Integer.parseInt(row[2]) - 1 : 0;

                                QuizQuestion question = QuizQuestion.builder()
                                                .quiz(quiz)
                                                .questionText(questionText)
                                                .questionOrder(q)
                                                .points(15)
                                                .questionType(QuestionType.MULTIPLE_CHOICE)
                                                .build();

                                String[] opts = optionsRaw.split("②|③|④");
                                for (int o = 0; o < Math.min(opts.length, 4); o++) {
                                        String optText = opts[o].replaceFirst("^①", "").trim();
                                        if (optText.isEmpty())
                                                optText = "선택지 " + (o + 1);
                                        QuizOption option = QuizOption.builder()
                                                        .question(question)
                                                        .optionText((o + 1) + ". " + optText)
                                                        .optionOrder(o + 1)
                                                        .isCorrect(o == correctOptIdx)
                                                        .build();
                                        question.getOptions().add(option);
                                }
                                quiz.getQuestions().add(question);
                        }

                        // 단답형 2문제 (data[5]~[6])
                        for (int q = 5; q <= 6 && q < data.length; q++) {
                                String[] row = data[q];
                                QuizQuestion question = QuizQuestion.builder()
                                                .quiz(quiz)
                                                .questionText(row[0])
                                                .questionOrder(q)
                                                .points(20)
                                                .questionType(QuestionType.SHORT_ANSWER)
                                                .correctAnswer(row[1])
                                                .build();
                                quiz.getQuestions().add(question);
                        }

                        quizRepository.save(quiz); // cascade → questions → options

                        // 학생 응시 (70% 제출)
                        List<StudentInfo> classStudents = studentsInClassroom(students, section.getClassroom());
                        for (StudentInfo student : classStudents) {
                                if (rng.nextInt(10) < 3)
                                        continue;

                                int earnedTotal = 0;
                                QuizSubmission submission = QuizSubmission.builder()
                                                .quiz(quiz)
                                                .student(student)
                                                .score(0)
                                                .totalPoints(quiz.getTotalPoints())
                                                .attemptNumber(1)
                                                .submittedAt(now.minusHours(rng.nextInt(48) + 1))
                                                .build();

                                for (QuizQuestion question : quiz.getQuestions()) {
                                        boolean correct = rng.nextInt(10) < 7; // 70% 정답
                                        int earned = correct ? question.getPoints() : 0;
                                        earnedTotal += earned;

                                        QuizAnswer.QuizAnswerBuilder answerBuilder = QuizAnswer.builder()
                                                        .submission(submission)
                                                        .question(question)
                                                        .isCorrect(correct)
                                                        .earnedPoints(earned);

                                        if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
                                                List<QuizOption> opts = question.getOptions();
                                                if (!opts.isEmpty()) {
                                                        QuizOption chosen = correct
                                                                        ? opts.stream().filter(QuizOption::isCorrect)
                                                                                        .findFirst().orElse(opts.get(0))
                                                                        : opts.get(rng.nextInt(opts.size()));
                                                        answerBuilder.selectedOption(chosen);
                                                }
                                        } else {
                                                answerBuilder.answerText(
                                                                correct ? question.getCorrectAnswer() : "모르겠습니다");
                                        }
                                        submission.getAnswers().add(answerBuilder.build());
                                }
                                submission.setScore(earnedTotal);
                                quizSubmissionRepository.save(submission);
                        }
                }
        }

        // ── 성적 ──────────────────────────────────────────────────────────────
        private void seedGrades(List<StudentInfo> students, List<Subject> subjects,
                        AcademicTerm term, List<TeacherInfo> teachers, School school) {
                if (students.isEmpty() || subjects.isEmpty())
                        return;
                if (!gradeRepository.findByStudentAndTerm(students.get(0).getId(), term.getId()).isEmpty())
                        return;

                TeacherInfo inputTeacher = teachers.isEmpty() ? null : teachers.get(0);

                for (int si = 0; si < students.size(); si++) {
                        StudentInfo student = students.get(si);
                        // 학생별 기본 성적 수준 (si 기반으로 80~95 범위)
                        int baseScore = 75 + (si * 7 % 20);

                        for (Subject subject : subjects) {
                                for (TestType testType : new TestType[] { TestType.MIDTERMTEST, TestType.FINALTEST }) {
                                        // 과목·시험별 소폭 변동
                                        double variance = (rng.nextDouble() * 20) - 5;
                                        double score = Math.min(100, Math.max(50, baseScore + variance));

                                        // 중복 체크
                                        if (gradeRepository.findByStudentIdAndSubjectIdAndAcademicTermIdAndTestType(
                                                        student.getId(), subject.getId(), term.getId(), testType)
                                                        .isPresent())
                                                continue;

                                        Grade grade = Grade.builder()
                                                        .student(student)
                                                        .subject(subject)
                                                        .academicTerm(term)
                                                        .testType(testType)
                                                        .score(Math.round(score * 10.0) / 10.0)
                                                        .inputTeacher(inputTeacher)
                                                        .build();
                                        grade.setSchool(school);
                                        gradeRepository.save(grade);
                                }
                        }
                }
        }

        // ── 도서관 ────────────────────────────────────────────────────────────
        private static final Object[][] BOOK_DATA = {
                // { 제목, 저자, 출판사, ISBN, BookCategory, 권수, 설명 }
                { "어린왕자", "생텍쥐페리", "을유문화사", "9788932473529", BookCategory.CATEGORY_800, 3,
                        "사막에 불시착한 비행사와 어린 왕자의 만남을 그린 세계적 명작" },
                { "해리포터와 마법사의 돌", "J.K. 롤링", "문학수첩", "9788983920997", BookCategory.CATEGORY_800, 2,
                        "마법 학교 호그와트에서 펼쳐지는 해리포터의 모험 이야기" },
                { "수학의 정석", "홍성대", "성지출판", "9788930151238", BookCategory.CATEGORY_400, 5,
                        "고등수학의 기초를 다지는 필수 참고서" },
                { "코스모스", "칼 세이건", "사이언스북스", "9788983710956", BookCategory.CATEGORY_400, 2,
                        "우주의 탄생과 진화를 담은 과학 교양서의 고전" },
                { "사피엔스", "유발 하라리", "김영사", "9788934972464", BookCategory.CATEGORY_900, 2,
                        "인류의 역사를 새로운 시각으로 재해석한 베스트셀러" },
                { "채식주의자", "한강", "창비", "9788936434588", BookCategory.CATEGORY_800, 2,
                        "한국 최초 맨부커상 수상 소설" },
                { "82년생 김지영", "조남주", "민음사", "9788937473135", BookCategory.CATEGORY_800, 2,
                        "평범한 한국 여성의 일상을 통해 사회 문제를 조명" },
                { "왜 세계의 절반은 굶주리는가", "장 지글러", "갈라파고스", "9788990977618", BookCategory.CATEGORY_300, 2,
                        "세계 식량 문제와 불평등을 고발하는 책" },
                { "파친코", "이민진", "인플루엔셜", "9791186864418", BookCategory.CATEGORY_800, 2,
                        "재일교포 4대의 역사를 그린 대하소설" },
                { "총균쇠", "재레드 다이아몬드", "문학사상", "9788970128696", BookCategory.CATEGORY_900, 1,
                        "문명의 흥망을 지리와 환경으로 설명한 퓰리처상 수상작" },
                { "데미안", "헤르만 헤세", "민음사", "9788937460203", BookCategory.CATEGORY_800, 3,
                        "청년기의 방황과 자아 발견을 그린 성장 소설" },
                { "1984", "조지 오웰", "민음사", "9788937460785", BookCategory.CATEGORY_800, 2,
                        "전체주의 사회를 경고한 디스토피아 소설" },
                { "지리의 힘", "팀 마샬", "사이", "9788983716781", BookCategory.CATEGORY_300, 2,
                        "지리가 세계 정치에 미치는 영향을 분석" },
                { "철학의 위안", "알랭 드 보통", "은행나무", "9788956603537", BookCategory.CATEGORY_100, 2,
                        "철학자들의 지혜로 일상의 고통을 위로받는 책" },
                { "군주론", "마키아벨리", "을유문화사", "9788932460147", BookCategory.CATEGORY_300, 1,
                        "권력과 정치의 본질을 다룬 르네상스 시대 명저" },
                { "논어", "공자", "홍익출판사", "9788970691091", BookCategory.CATEGORY_100, 2,
                        "공자의 언행과 사상을 기록한 유교의 근본 경전" },
                { "파우스트", "괴테", "민음사", "9788937460463", BookCategory.CATEGORY_800, 1,
                        "지식과 행복을 향한 인간의 끊임없는 탐구를 그린 서사시" },
                { "어떻게 살 것인가", "유시민", "아름다운사람들", "9788973806218", BookCategory.CATEGORY_100, 3,
                        "삶의 의미와 방향에 대한 성찰을 담은 에세이" },
                { "미래의 직업", "버나드 마르", "비즈니스북스", "9791165218539", BookCategory.CATEGORY_500, 2,
                        "AI 시대에 살아남을 직업과 미래 트렌드 분석" },
                { "파이썬 기초와 응용", "박현식", "생능출판", "9791156722649", BookCategory.CATEGORY_500, 3,
                        "파이썬 프로그래밍 기초부터 응용까지 단계적으로 학습" },
        };

        private void seedLibrary(School school, List<StudentInfo> students) {
                if (!bookRepository.findRecent(school.getId(), PageRequest.of(0, 1)).isEmpty())
                        return;

                List<Book> savedBooks = new ArrayList<>();
                for (Object[] bd : BOOK_DATA) {
                        String isbn = (String) bd[3];
                        if (bookRepository.findBySchoolAndIsbn(school.getId(), isbn).isPresent())
                                continue;

                        Book book = Book.builder()
                                        .title((String) bd[0])
                                        .author((String) bd[1])
                                        .publisher((String) bd[2])
                                        .isbn(isbn)
                                        .category((BookCategory) bd[4])
                                        .totalCopies((Integer) bd[5])
                                        .description((String) bd[6])
                                        .publishDate(LocalDate.of(2018 + rng.nextInt(7), 1 + rng.nextInt(12), 1))
                                        .pages(200 + rng.nextInt(300))
                                        .borrowCount(0L)
                                        .build();
                        book.setSchool(school);
                        savedBooks.add(bookRepository.save(book));
                }

                if (savedBooks.isEmpty() || students.isEmpty())
                        return;

                // 대출 이력 (학생 8명 × 각 1~2권)
                int loanCount = 0;
                for (int si = 0; si < Math.min(students.size(), 10); si++) {
                        StudentInfo student = students.get(si);
                        int numLoans = (si % 3 == 0) ? 2 : 1;

                        for (int l = 0; l < numLoans && loanCount < savedBooks.size(); l++) {
                                Book book = savedBooks.get(loanCount % savedBooks.size());
                                boolean returned = loanCount < 6; // 앞 6개는 반납 완료
                                LocalDate borrowDate = LocalDate.now().minusDays(20 + loanCount * 3L);
                                LocalDate dueDate = borrowDate.plusDays(14);
                                LocalDate returnDate = returned ? borrowDate.plusDays(rng.nextInt(12) + 1) : null;

                                BookLoan loan = BookLoan.builder()
                                                .book(book)
                                                .studentInfo(student)
                                                .borrowDate(borrowDate)
                                                .dueDate(dueDate)
                                                .returnDate(returnDate)
                                                .status(returned ? BookLoanStatus.RETURNED : BookLoanStatus.BORROWED)
                                                .extensionCount(0)
                                                .build();
                                loan.setSchool(school);
                                bookLoanRepository.save(loan);
                                book.increaseBorrowCount();
                                bookRepository.save(book);
                                loanCount++;
                        }
                }

                // 도서 리뷰 (5명)
                String[] reviewTexts = {
                        "정말 재미있게 읽었습니다. 주인공의 모험이 생생하게 느껴졌어요.",
                        "어렵지만 읽고 나서 많은 것을 배웠습니다. 추천합니다.",
                        "감동적인 이야기였습니다. 다음에 또 읽고 싶어요.",
                        "처음엔 어려웠지만 읽다 보니 재미있었어요. 특히 3장이 좋았습니다.",
                        "교과서에서 배운 내용이 실제로 어떻게 쓰이는지 잘 설명되어 있어요.",
                };
                for (int ri = 0; ri < Math.min(5, students.size()); ri++) {
                        Book book = savedBooks.get(ri % savedBooks.size());
                        StudentInfo student = students.get(ri);

                        BookReview review = BookReview.builder()
                                        .book(book)
                                        .studentInfo(student)
                                        .rating(3 + rng.nextInt(3)) // 3~5점
                                        .content(reviewTexts[ri % reviewTexts.length])
                                        .build();
                        review.setSchool(school);
                        bookReviewRepository.save(review);
                }
        }

        // ── 기숙사 배정 ────────────────────────────────────────────────────────
        private void seedDormitoryAssignments(School school, List<StudentInfo> students, AcademicTerm term) {
                if (students.isEmpty())
                        return;
                if (!dormitoryAssignmentRepository.findAllActiveBySchoolId(school.getId()).isEmpty())
                        return;

                List<Dormitory> emptyBeds = dormitoryRepository.findEmptyBeds(school.getId());
                if (emptyBeds.isEmpty())
                        return;

                // 학생의 40%를 기숙사에 배정
                int maxAssign = Math.min(emptyBeds.size(), students.size() * 4 / 10 + 1);
                int bedIdx = 0;

                for (int si = 0; si < students.size() && bedIdx < maxAssign; si++) {
                        if (rng.nextInt(10) < 6)
                                continue; // 60% 스킵 → 약 40%만 선택
                        StudentInfo student = students.get(si);

                        // 이미 배정된 학생 스킵
                        if (dormitoryAssignmentRepository.findByStudentInfoIdAndAcademicTermId(
                                        student.getId(), term.getId()).isPresent())
                                continue;
                        if (bedIdx >= emptyBeds.size())
                                break;

                        Dormitory bed = emptyBeds.get(bedIdx++);
                        DormitoryAssignment assignment = DormitoryAssignment.builder()
                                        .studentInfo(student)
                                        .academicTerm(term)
                                        .dormitory(bed)
                                        .build();
                        assignment.setSchool(school);
                        dormitoryAssignmentRepository.save(assignment);
                }
        }

        // ── 학생 생활기록부 ────────────────────────────────────────────────────
        private void seedStudentRecords(List<StudentInfo> students, AcademicTerm term, School school) {
                if (students.isEmpty())
                        return;
                if (!behaviorRecordRepository.findByStudentId(students.get(0).getId()).isEmpty())
                        return;

                String[] behaviorNotes = {
                        "수업 참여도가 높고 친구들을 배려하는 모습이 인상적임. 발표 시 자신의 의견을 명확하게 표현하며 리더십을 발휘함.",
                        "성실한 학습 태도로 꾸준히 노력하는 학생임. 수학 분야에서 특히 뛰어난 문제 해결 능력을 보임.",
                        "창의적인 사고력이 뛰어나며 예술 활동에 적극 참여함. 친구들과의 협동 작업에서 아이디어를 많이 제시함.",
                        "규칙을 잘 지키고 책임감이 강한 학생임. 학급 청소 및 봉사 활동에 자발적으로 참여함.",
                        "독서를 좋아하며 언어 능력이 우수함. 다양한 분야에 관심을 보이며 탐구 정신이 강함.",
                        "운동을 좋아하고 체육 활동에서 두각을 나타냄. 팀 정신이 강하고 협력하는 자세가 훌륭함.",
                };
                String[] careerJobs = {
                        "소프트웨어 개발자", "의사", "과학자", "교사", "건축가",
                        "예술가", "영화감독", "운동선수", "작가", "연구원",
                };
                String[] parentJobs = {
                        "의사", "변호사", "교사", "공무원", "연구원",
                        "IT전문가", "경영자", "금융전문가", "예술가", "운동선수",
                };
                String[] interests = {
                        "독서, 그림 그리기", "수학, 과학 실험", "음악, 악기 연주",
                        "운동, 축구", "코딩, 게임 제작", "요리, 제과제빵",
                        "여행, 지리 탐구", "역사, 문화 탐방",
                };
                String[][] awards = {
                        { "교내 독서왕", "학교", AchievementsGrade.GOLD.name() },
                        { "수학 경시대회", "교육청", AchievementsGrade.SILVER.name() },
                        { "과학탐구대회", "학교", AchievementsGrade.BRONZE.name() },
                        { "영어 말하기 대회", "학교", AchievementsGrade.GOLD.name() },
                        { "미술 실기대회", "교육청", AchievementsGrade.SILVER.name() },
                        { "체육 대회 달리기", "학교", AchievementsGrade.BRONZE.name() },
                        { "글짓기 대회", "학교", AchievementsGrade.HONORABLE_MENTION.name() },
                };
                String[][] volunteering = {
                        { "환경 정화 활동", "학교 봉사단", "교내 환경 정화 및 분리수거 활동", "2.0" },
                        { "도서관 사서 보조", "학교 도서관", "도서 정리 및 대출 반납 보조", "3.0" },
                        { "지역 사회 봉사", "○○복지관", "지역 어르신 말벗 봉사 활동", "4.0" },
                        { "급식 도우미", "학교 급식실", "급식 배식 및 정리 보조", "1.0" },
                        { "텃밭 가꾸기", "학교 환경부", "학교 텃밭 관리 및 수확 활동", "2.0" },
                };
                String[][] cocurricular = {
                        // { category, specifics }
                        { ActivityCategory.CLUB.name(), "과학탐구반에서 생태계 실험을 수행하고 결과를 발표함. 팀장으로서 역할을 충실히 수행함." },
                        { ActivityCategory.AUTONOMOUS.name(), "학급 자치회 활동에 적극 참여하여 학급 행사 기획에 기여함." },
                        { ActivityCategory.VOLUNTEER.name(), "지역 봉사 활동에 참여하여 사회 참여 의식을 함양함." },
                        { ActivityCategory.CAREER.name(), "진로 탐색 활동을 통해 관심 직업에 대해 심층 탐구하고 발표함." },
                };
                String[] bookReportContents = {
                        "<p>『어린왕자』를 읽고 나서 어른이 된다는 것의 의미에 대해 깊이 생각하게 되었습니다. " +
                                        "특히 '가장 중요한 것은 눈에 보이지 않는다'는 구절이 오랫동안 마음에 남았습니다.</p>",
                        "<p>『사피엔스』를 읽으며 인류 역사의 흐름을 큰 그림으로 바라보는 시각을 얻었습니다. " +
                                        "과거의 역사가 현재 우리의 삶과 어떻게 연결되는지 새롭게 이해하게 되었습니다.</p>",
                        "<p>『코스모스』를 읽고 우주의 광대함 앞에서 겸손함을 느꼈습니다. " +
                                        "과학적 사실과 아름다운 문장이 조화를 이루어 쉽게 읽혔습니다.</p>",
                        "<p>『데미안』을 읽으며 자신만의 길을 찾아가는 용기의 중요성을 배웠습니다. " +
                                        "헤르만 헤세의 문체가 매우 인상적이었습니다.</p>",
                        "<p>『어떻게 살 것인가』를 통해 삶의 방향에 대해 진지하게 생각해 보게 되었습니다. " +
                                        "저자의 경험담과 철학적 사유가 와닿았습니다.</p>",
                };

                for (int si = 0; si < students.size(); si++) {
                        StudentInfo student = students.get(si);

                        // 행동 특성
                        if (behaviorRecordRepository.findByStudentId(student.getId()).isEmpty()) {
                                BehaviorRecord record = BehaviorRecord.builder()
                                                .student(student)
                                                .academicTerm(term)
                                                .specialNotes(behaviorNotes[si % behaviorNotes.length])
                                                .build();
                                record.setSchool(school);
                                behaviorRecordRepository.save(record);
                        }

                        // 진로 희망
                        if (careerAspirationRepository.findAll().stream()
                                        .noneMatch(c -> c.getStudent().getId().equals(student.getId())
                                                        && c.getAcademicTerm().getId().equals(term.getId()))) {
                                CareerAspiration career = CareerAspiration.builder()
                                                .student(student)
                                                .academicTerm(term)
                                                .specialtyOrInterest(interests[si % interests.length])
                                                .studentDesiredJob(careerJobs[si % careerJobs.length])
                                                .parentDesiredJob(parentJobs[si % parentJobs.length])
                                                .preparationPlan("관련 책을 읽고 관심 분야를 꾸준히 탐구할 예정입니다.")
                                                .build();
                                career.setSchool(school);
                                careerAspirationRepository.save(career);
                        }

                        // 수상 이력 (40% 학생)
                        if (si % 5 != 4) {
                                String[] awardRow = awards[si % awards.length];
                                AwardsAndHonors award = AwardsAndHonors.builder()
                                                .studentInfo(student)
                                                .name(awardRow[0])
                                                .achievementsGrade(AchievementsGrade.valueOf(awardRow[2]))
                                                .day(LocalDate.now().minusMonths(si % 4 + 1))
                                                .awardingOrganization(awardRow[1])
                                                .build();
                                award.setSchool(school);
                                awardsAndHonorsRepository.save(award);
                        }

                        // 봉사 활동 (60% 학생)
                        if (si % 5 < 3) {
                                String[] volRow = volunteering[si % volunteering.length];
                                double hours = Double.parseDouble(volRow[3]);
                                VolunteerActivity vol = VolunteerActivity.builder()
                                                .studentInfo(student)
                                                .academicTerm(term)
                                                .startDate(LocalDate.now().minusMonths(2).plusDays(si))
                                                .organizer(volRow[1])
                                                .activityContent(volRow[2])
                                                .hours(hours)
                                                .cumulativeHours(hours + (si % 3) * 1.5)
                                                .build();
                                vol.setSchool(school);
                                volunteerActivityRepository.save(vol);
                        }

                        // 창의적 체험활동 (전원 — 4개 영역)
                        for (String[] co : cocurricular) {
                                ActivityCategory cat = ActivityCategory.valueOf(co[0]);
                                if (cocurricularActivitiesRepository.findByStudentIdAndAcademicTermIdAndCategory(
                                                student.getId(), term.getId(), cat).isPresent())
                                        continue;
                                CocurricularActivities activity = CocurricularActivities.builder()
                                                .student(student)
                                                .academicTerm(term)
                                                .category(cat)
                                                .specifics(co[1])
                                                .build();
                                activity.setSchool(school);
                                cocurricularActivitiesRepository.save(activity);
                        }

                        // 독서 감상문 (50% 학생)
                        if (si % 2 == 0) {
                                BookReport report = BookReport.builder()
                                                .studentInfo(student)
                                                .academicTerm(term)
                                                .content(bookReportContents[si % bookReportContents.length])
                                                .build();
                                report.setSchool(school);
                                bookReportRepository.save(report);
                        }
                }
        }

        // ── 상담 예약 ──────────────────────────────────────────────────────────
        private void seedConsultations(School school, List<StudentInfo> students, int year) {
                if (students.isEmpty())
                        return;
                // 첫 번째 학생에게 상담 예약이 있으면 스킵
                if (!consultationReservationRepository
                                .findByStudentInfo_User_UidOrderByDateDescStartTimeDesc(
                                                students.get(0).getUser().getUid())
                                .isEmpty())
                        return;

                ConsultationType[] types = ConsultationType.values();
                ReservationStatus[] statuses = { ReservationStatus.CONFIRMED, ReservationStatus.PENDING,
                                ReservationStatus.COMPLETED, ReservationStatus.COMPLETED, ReservationStatus.PENDING };
                String[] contents = {
                        "자녀의 최근 학업 성취도에 대해 상담을 요청드립니다. 수학 과목에서 어려움을 겪고 있는 것 같아 걱정됩니다.",
                        "아이의 교우 관계에 대해 선생님께 여쭤보고 싶습니다. 친구들과 잘 어울리는지 궁금합니다.",
                        "진로 교육과 관련하여 담임 선생님의 의견을 듣고 싶습니다. 아이가 특별히 관심을 보이는 분야가 있는지요.",
                        "생활 태도 및 수업 집중도에 관해 상담을 신청합니다. 가정에서도 어떻게 도와줄 수 있을지 의논하고 싶습니다.",
                        "2학기 학습 계획을 세우는 데 도움을 받고자 합니다. 취약 과목 보완 방법을 상의하고 싶습니다.",
                };

                int consultationCount = 0;
                for (int si = 0; si < students.size() && consultationCount < 6; si++) {
                        StudentInfo student = students.get(si);
                        if (student.getFamilyRelations().isEmpty())
                                continue;

                        User parentUser = student.getFamilyRelations().get(0).getParentInfo().getUser();
                        if (parentUser == null)
                                continue;

                        LocalDate consultDate = LocalDate.of(year, 5, 12).plusDays(consultationCount * 3L);
                        LocalTime startTime = LocalTime.of(14 + (consultationCount % 3), 0);

                        ConsultationReservation reservation = new ConsultationReservation();
                        reservation.setDate(consultDate);
                        reservation.setStartTime(startTime);
                        reservation.setEndTime(startTime.plusMinutes(30));
                        reservation.setWriter(parentUser);
                        reservation.setStudentInfo(student);
                        reservation.setContent(contents[consultationCount % contents.length]);
                        reservation.setStatus(statuses[consultationCount % statuses.length]);
                        reservation.setConsultationType(types[consultationCount % types.length]);
                        reservation.setSchool(school);
                        consultationReservationRepository.save(reservation);
                        consultationCount++;
                }
        }

        // ── 학급 게시판 ────────────────────────────────────────────────────────
        private void seedClassBoards(School school, List<Classroom> classrooms,
                        List<TeacherInfo> teachers, List<StudentInfo> students) {
                if (boardRepository.existsBySchool_IdAndBoardTypeAndIsDeleted(
                                school.getId(), BoardType.CLASS_BOARD, false))
                        return;

                String[][] teacherPosts = {
                        { "공지", "이번 주 학습 안내 및 준비물",
                                "<p>이번 주 수업 안내입니다.</p><ul><li>화요일 3교시: 과학 실험 (실험복 지참)</li><li>목요일: 수학 단원평가</li><li>금요일 방과후: 독서 발표</li></ul>" },
                        { "공지", "다음 주 현장학습 안내",
                                "<p>다음 주 <strong>목요일</strong> 현장학습이 진행됩니다.</p><ul><li>집합 시간: 8:30 교문 앞</li><li>준비물: 도시락, 물, 편한 복장</li><li>귀교 예정: 오후 4시</li></ul>" },
                        { "공지", "5월 행사 일정 안내",
                                "<p>5월 주요 행사 일정을 안내드립니다.</p><ul><li>5/5 어린이날 휴무</li><li>5/12~16 학부모 상담 주간</li><li>5/23 체육대회</li></ul>" },
                };

                String[][] studentPosts = {
                        { "질문", "수학 숙제 질문 있어요",
                                "<p>오늘 수학 숙제 32쪽 3번 문제가 이해가 안 가는데 아는 분 계신가요? 풀이 과정이 헷갈려서요 ㅠㅠ</p>" },
                        { "질문", "이번 주 시험 범위 맞나요?",
                                "<p>선생님이 말씀하신 시험 범위가 2단원까지인지 3단원까지인지 헷갈려요. 아는 분 있으면 알려주세요!</p>" },
                        { "모임", "스터디 그룹 같이 하실 분~",
                                "<p>중간고사 준비 같이 할 스터디 모집합니다! 주 2회, 도서관에서 만날 예정이에요. 관심 있는 분 댓글 남겨주세요 😊</p>" },
                        { "유머", "오늘 급식 진짜 맛있었다",
                                "<p>오늘 점심 돼지불고기 진짜 맛있지 않았나요?? 우리 학교 급식 최고인 것 같아요ㅋㅋ 여러분은 어떤 급식 메뉴 좋아하세요?</p>" },
                };

                String[] teacherComments = {
                        "좋은 질문이에요! 내일 수업 시간에 같이 풀어봅시다.",
                        "맞습니다, 3단원까지입니다. 잘 확인했네요!",
                        "스터디 그룹 정말 좋은 시도예요! 응원합니다.",
                };
                String[] studentComments = {
                        "저도 같은 문제 막혔어요 ㅋㅋ",
                        "저는 알아요! 내일 알려드릴게요",
                        "저도 낄게요! 같이 해봐요",
                        "오늘 카레라이스도 맛있었어요ㅋㅋ",
                        "스터디 저도 할게요!",
                };

                for (int ci = 0; ci < classrooms.size(); ci++) {
                        Classroom classroom = classrooms.get(ci);
                        User teacherUser = classroom.getTeacher();
                        List<StudentInfo> classStudents = studentsInClassroom(students, classroom);
                        if (teacherUser == null || classStudents.isEmpty())
                                continue;

                        // 교사 게시글 2건
                        for (int p = 0; p < 2; p++) {
                                String[] post = teacherPosts[(ci + p) % teacherPosts.length];
                                Board board = Board.builder()
                                                .boardType(BoardType.CLASS_BOARD)
                                                .title(post[1])
                                                .content(post[2])
                                                .writer(teacherUser)
                                                .targetClassroom(classroom)
                                                .tag(post[0])
                                                .viewCount(rng.nextInt(20) + 5)
                                                .build();
                                board.setSchool(school);
                                Board savedTeacherPost = boardRepository.save(board);

                                // 학생 댓글 1개
                                if (!classStudents.isEmpty()) {
                                        StudentInfo commenter = classStudents.get(rng.nextInt(classStudents.size()));
                                        Comment comment = Comment.builder()
                                                        .board(savedTeacherPost)
                                                        .writer(commenter.getUser())
                                                        .content(teacherComments[(ci + p) % teacherComments.length])
                                                        .build();
                                        commentRepository.save(comment);
                                }
                        }

                        // 학생 게시글 2건 (게시판이 있는 학급만)
                        for (int p = 0; p < 2; p++) {
                                int studentPostIdx = (ci * 2 + p) % studentPosts.length;
                                String[] post = studentPosts[studentPostIdx];
                                StudentInfo author = classStudents.get((ci + p) % classStudents.size());

                                Board board = Board.builder()
                                                .boardType(BoardType.CLASS_BOARD)
                                                .title(post[1])
                                                .content(post[2])
                                                .writer(author.getUser())
                                                .targetClassroom(classroom)
                                                .tag(post[0])
                                                .viewCount(rng.nextInt(15) + 2)
                                                .build();
                                board.setSchool(school);
                                Board savedStudentPost = boardRepository.save(board);

                                // 댓글 1~2개
                                for (int c = 0; c < 1 + rng.nextInt(2); c++) {
                                        boolean isTeacherComment = c == 0 && studentPostIdx < 2;
                                        User commenterUser = isTeacherComment ? teacherUser
                                                        : classStudents.get(
                                                                        rng.nextInt(classStudents.size())).getUser();
                                        String commentContent = isTeacherComment
                                                        ? teacherComments[(ci + c) % teacherComments.length]
                                                        : studentComments[(ci + c) % studentComments.length];
                                        Comment comment = Comment.builder()
                                                        .board(savedStudentPost)
                                                        .writer(commenterUser)
                                                        .content(commentContent)
                                                        .build();
                                        commentRepository.save(comment);
                                }
                        }
                }
        }

        // ── 서비스 공지사항 ────────────────────────────────────────────────────
        private void seedServiceNotices() {
                if (!serviceNoticeRepository.findAllActive(null, PageRequest.of(0, 1)).isEmpty())
                        return;

                Object[][] notices = {
                        // { title, content, isPinned }
                        { "SchoolMate 서비스 오픈 안내",
                                "<p>안녕하세요, <strong>SchoolMate</strong> 서비스가 정식 오픈되었습니다.</p>"
                                + "<p>학교 구성원 모두가 편리하게 사용할 수 있도록 지속적으로 개선해 나가겠습니다. 많은 관심과 이용 부탁드립니다.</p>"
                                + "<p>사용 중 불편한 점이나 문의 사항은 고객센터로 연락 주세요.</p>",
                                true },
                        { "개인정보 처리방침 업데이트 안내",
                                "<p>2026년 3월 1일부터 개인정보 처리방침이 일부 변경됩니다.</p>"
                                + "<ul><li>수집 항목: 이름, 이메일, 연락처</li>"
                                + "<li>보관 기간: 회원 탈퇴 후 30일</li>"
                                + "<li>제3자 제공: 해당 없음</li></ul>"
                                + "<p>자세한 내용은 개인정보 처리방침 페이지를 확인해 주세요.</p>",
                                true },
                        { "[점검 완료] 3월 정기 서버 점검 안내",
                                "<p>3월 15일(토) 02:00 ~ 04:00 진행 예정이었던 정기 서버 점검이 완료되었습니다.</p>"
                                + "<p>점검 내용: 데이터베이스 성능 최적화, 보안 패치 적용</p>"
                                + "<p>이용에 불편을 드려 죄송합니다.</p>",
                                false },
                        { "모바일 앱 v2.1.0 업데이트 안내",
                                "<p>SchoolMate 모바일 앱이 업데이트되었습니다.</p>"
                                + "<ul><li>퀴즈 제한 시간 표시 기능 추가</li>"
                                + "<li>알림장 이미지 첨부 기능 개선</li>"
                                + "<li>성적 조회 화면 UI 개선</li>"
                                + "<li>일부 버그 수정 및 성능 향상</li></ul>"
                                + "<p>앱스토어 / 플레이스토어에서 최신 버전으로 업데이트하세요.</p>",
                                false },
                        { "학부모 상담 예약 기능 출시 안내",
                                "<p>학부모와 담임 선생님 간 <strong>1:1 상담 예약 기능</strong>이 출시되었습니다.</p>"
                                + "<p>앱 내 상담 예약 메뉴에서 원하시는 날짜와 시간을 선택하여 예약하실 수 있습니다.</p>"
                                + "<p>담임 선생님이 예약을 확인하고 승인하면 확정됩니다.</p>",
                                false },
                };

                for (Object[] n : notices) {
                        ServiceNotice notice = ServiceNotice.builder()
                                        .title((String) n[0])
                                        .content((String) n[1])
                                        .writerName("SchoolMate 운영팀")
                                        .isPinned((Boolean) n[2])
                                        .build();
                        serviceNoticeRepository.save(notice);
                }
        }

        // ── 헬퍼 ──────────────────────────────────────────────────────────────
        private List<StudentInfo> studentsInClassroom(List<StudentInfo> students, Classroom classroom) {
                return students.stream()
                                .filter(s -> s.getAssignments().stream()
                                                .anyMatch(a -> a.getClassroom() != null
                                                                && a.getClassroom().getCid()
                                                                                .equals(classroom.getCid())))
                                .collect(Collectors.toList());
        }
}

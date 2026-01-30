package com.example.schoolmate.woo.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.cheol.dto.GradeDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentCreateDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentResponseDTO;
import com.example.schoolmate.cheol.dto.studentdto.StudentUpdateDTO;
import com.example.schoolmate.cheol.entity.Grade;
import com.example.schoolmate.cheol.entity.Subject;
import com.example.schoolmate.cheol.repository.GradeRepository;
import com.example.schoolmate.cheol.repository.SubjectRepository;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.repository.ClassroomRepository;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.woo.dto.ClassStudentDTO;
import com.example.schoolmate.woo.dto.GradeInputDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherResponseDTO;
import com.example.schoolmate.woo.dto.teacherdto.TeacherUpdateDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * ========================================
 * TeacherService - 교사용 서비스
 * ========================================
 *
 * [현재 구현된 기능 요약]
 *
 * 1. 교사 정보 (배정 필요 없음)
 * - getTeacherById(): 본인 정보 조회
 * - getAllTeachers(): 전체 교사 목록 (관리용)
 * - updateTeacher(): 본인 정보 수정
 *
 * 2. 학생 CRUD (⚠️ 현재: 모든 학생 대상, 담당 학급 제한 없음)
 * - createStudent(): 학생 등록 (classroomId 직접 지정)
 * - getStudentById(): 학생 조회
 * - getAllStudents(): 전체 학생 목록
 * - updateStudent(): 학생 수정
 * - deleteStudent(): 학생 삭제 (소프트 삭제)
 *
 * 3. 담당 학급 조회 (★ 담임 배정 필요)
 * - getMyClassStudents(): 내 담임 학급 학생들 조회
 * - getClassStudents(): 특정 학급 학생 조회 (학년/반으로)
 *
 * 4. 성적 관리 (⚠️ 담당 과목 체크가 느슨함 - 경고만 출력)
 * - inputGrade(): 성적 입력
 * - updateGrade(): 성적 수정
 * - getMySubjectGrades(): 과목별 성적 조회
 * - getStudentGrades(): 학생별 성적 조회
 *
 * ========================================
 * [TODO - 담임 배정 후 사용할 기능 추가 필요]
 * ========================================
 *
 * 현재 문제점:
 * - 학급에 담임 배정하는 기능이 이 서비스에 없음 (AdminService에서 처리해야 함)
 * - 학생 CRUD가 담당 학급과 무관하게 전체 학생 대상으로 동작함
 * - 담임 교사만 자기 반 학생을 관리하도록 제한하는 로직이 없음
 *
 * 추가 구현 필요 기능:
 * 1. 담당 학급 학생만 CRUD (createStudentInMyClass, updateMyClassStudent 등)
 * 2. 출석 관리 (담당 학급)
 * 3. 알림장/공지 작성 (담당 학급)
 * 4. 상담 기록 관리
 * 5. 가정통신문 발송
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본적으로 읽기 전용 트랜잭션 (쓰기 메서드에만 @Transactional 추가)
@Log4j2
public class TeacherService {

    // ==================== Repository 의존성 주입 ====================

    // 공통 Repository (common 패키지)
    private final TeacherInfoRepository teacherRepository; // 교사 정보 CRUD
    private final StudentInfoRepository studentRepository; // 학생 정보 CRUD
    private final ClassroomRepository classroomRepository; // 학급(반) 정보 CRUD

    // cheol 폴더 Repository (성적 관련 - 연동)
    private final GradeRepository gradeRepository; // 성적 CRUD
    private final SubjectRepository subjectRepository; // 과목 조회

    // ==================================================================================
    // ========== 1. 교사 정보 관리 (배정 없이도 사용 가능) ==========
    // ==================================================================================

    /**
     * 교사 정보 단건 조회
     * - 용도: 마이페이지, 프로필 조회
     * - 배정 필요: X (본인 정보는 언제든 조회 가능)
     *
     * @param id 교사 ID (TeacherInfo의 PK)
     * @return 교사 정보 DTO
     */
    public TeacherResponseDTO getTeacherById(Long id) {
        TeacherInfo teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));

        return new TeacherResponseDTO(teacher);
    }

    /**
     * 전체 교사 목록 조회
     * - 용도: 관리자용 교사 목록, 담임 배정 시 교사 선택 등
     * - 배정 필요: X
     *
     * @return 전체 교사 목록
     */
    public List<TeacherResponseDTO> getAllTeachers() {
        return teacherRepository.findAll().stream()
                .map(TeacherResponseDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * 교사 정보 수정 (본인 정보 수정용)
     * - 용도: 마이페이지에서 담당과목, 부서, 직위 등 수정
     * - 배정 필요: X
     * - Dirty Checking: 영속성 컨텍스트가 관리하는 엔티티의 필드가 변경되면
     * 트랜잭션 커밋 시점에 자동으로 UPDATE 쿼리 실행됨
     *
     * @param id        교사 ID
     * @param updateDTO 수정할 정보 (null인 필드는 수정 안 함)
     * @return 수정된 교사 정보
     */
    @Transactional // 쓰기 작업이므로 readOnly=false 트랜잭션 필요
    public TeacherResponseDTO updateTeacher(Long id, TeacherUpdateDTO updateDTO) {
        TeacherInfo teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + id));

        // null 체크해서 있는 것만 업데이트 (Dirty Checking으로 자동 반영)
        if (updateDTO.getSubject() != null) {
            teacher.setSubject(updateDTO.getSubject()); // 담당 과목
        }
        if (updateDTO.getDepartment() != null) {
            teacher.setDepartment(updateDTO.getDepartment()); // 부서
        }
        if (updateDTO.getPosition() != null) {
            teacher.setPosition(updateDTO.getPosition()); // 직위 (담임, 부장 등)
        }
        if (updateDTO.getStatus() != null) {
            teacher.setStatus(updateDTO.getStatus()); // 상태 (재직, 휴직 등)
        }

        // save() 호출 안 해도 됨 - Dirty Checking으로 트랜잭션 종료 시 자동 UPDATE
        return new TeacherResponseDTO(teacher);
    }

    // ==================================================================================
    // ========== 2. 학생 CRUD (⚠️ 주의: 현재 담당 학급 제한 없음!) ==========
    // ==================================================================================
    //
    // ⚠️ 문제점: 이 메서드들은 모든 학생에 대해 동작함
    // 담임 교사가 자기 반 학생만 관리하도록 제한하는 로직이 없음!
    //
    // TODO: 담당 학급 제한 기능 추가 필요
    // 예) createStudentInMyClass(Long teacherId, StudentCreateDTO dto)
    // -> 먼저 teacherId로 담임 학급을 찾고, 그 학급에만 학생 추가
    // ==================================================================================

    /**
     * 학생 등록 (신규 학생 추가)
     * - 용도: 전학생, 신입생 등록
     * - 배정 필요: X (현재 구현) → ⚠️ 담당 학급만 등록 가능하도록 변경 필요
     *
     * ⚠️ 현재 문제: classroomId를 직접 지정하므로 어느 반이든 학생 추가 가능
     * 담임이 아닌 반에도 학생을 넣을 수 있음!
     *
     * @param createDTO 학생 생성 정보 (학번, 반ID, 생년월일, 주소, 연락처, 성별)
     * @return 생성된 학생 정보
     */
    @Transactional
    public StudentResponseDTO createStudent(StudentCreateDTO createDTO) {
        log.info("학생 등록: {}", createDTO.getStudentNumber());

        // 1. 학번 중복 체크 (학번은 고유해야 함)
        if (studentRepository.findByStudentNumber(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        // 2. Classroom(학급) 조회 - 학생이 배정될 반
        Classroom classroom = classroomRepository.findById(createDTO.getClassroomId())
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + createDTO.getClassroomId()));

        // 3. StudentInfo 엔티티 생성 및 필드 설정
        StudentInfo student = new StudentInfo();
        student.setStudentNumber(createDTO.getStudentNumber()); // 학번 (예: 20240101)
        student.setClassroom(classroom); // 소속 학급
        student.setBirthDate(createDTO.getBirthDate()); // 생년월일
        student.setAddress(createDTO.getAddress()); // 주소
        student.setPhone(createDTO.getPhone()); // 연락처
        student.setGender(createDTO.getGender()); // 성별

        // 4. DB에 저장
        StudentInfo savedStudent = studentRepository.save(student);
        return new StudentResponseDTO(savedStudent);
    }

    /**
     * 학생 단건 조회
     * - 용도: 학생 상세 정보 확인
     * - 배정 필요: X (현재 구현) → 필요시 담당 학급 학생만 조회하도록 제한 가능
     */
    public StudentResponseDTO getStudentById(Long studentId) {
        StudentInfo student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));
        return new StudentResponseDTO(student);
    }

    /**
     * 전체 학생 목록 조회
     * - 용도: 관리자용, 학생 검색 등
     * - 배정 필요: X
     *
     * ⚠️ 주의: 모든 학생이 조회됨 (담당 학급 제한 없음)
     * 실제 서비스에서는 교사별로 조회 범위를 제한해야 할 수 있음
     */
    public List<StudentResponseDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(StudentResponseDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * 학생 정보 수정
     * - 용도: 학생 개인정보 변경 (반 이동, 주소 변경 등)
     * - 배정 필요: X (현재 구현) → ⚠️ 담당 학급 학생만 수정 가능하도록 변경 필요
     *
     * ⚠️ 현재 문제: 어떤 학생이든 수정 가능, classroomId로 다른 반으로 이동도 가능
     *
     * @param studentId 수정할 학생 ID
     * @param updateDTO 수정할 정보 (null인 필드는 수정 안 함)
     * @return 수정된 학생 정보
     */
    @Transactional
    public StudentResponseDTO updateStudent(Long studentId, StudentUpdateDTO updateDTO) {
        StudentInfo student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        // Dirty Checking으로 변경된 필드만 UPDATE
        if (updateDTO.getClassroomId() != null) {
            // 반 이동 (전학, 반 배정 변경)
            Classroom classroom = classroomRepository.findById(updateDTO.getClassroomId())
                    .orElseThrow(
                            () -> new IllegalArgumentException("학급을 찾을 수 없습니다. ID: " + updateDTO.getClassroomId()));
            student.setClassroom(classroom);
        }
        if (updateDTO.getBirthDate() != null) {
            student.setBirthDate(updateDTO.getBirthDate());
        }
        if (updateDTO.getAddress() != null) {
            student.setAddress(updateDTO.getAddress());
        }
        if (updateDTO.getPhone() != null) {
            student.setPhone(updateDTO.getPhone());
        }
        if (updateDTO.getGender() != null) {
            student.setGender(updateDTO.getGender());
        }

        return new StudentResponseDTO(student);
    }

    /**
     * 학생 삭제 (소프트 삭제 - 자퇴 처리)
     * - 용도: 자퇴, 전출 등
     * - 배정 필요: X (현재 구현)
     *
     * ※ 소프트 삭제: 실제 DB에서 삭제하지 않고 상태만 DROPOUT으로 변경
     * 학적부 등 기록 보존을 위해 소프트 삭제 방식 사용
     *
     * @param studentId 삭제(자퇴처리)할 학생 ID
     */
    @Transactional
    public void deleteStudent(Long studentId) {
        StudentInfo student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        // 소프트 삭제: status 필드를 DROPOUT으로 변경
        // (실제 DELETE 쿼리 대신 UPDATE 쿼리 실행됨)
        student.setStatus(StudentStatus.DROPOUT);
        log.info("학생 삭제(자퇴) 처리: {}", studentId);
    }

    // ==================================================================================
    // ========== 3. 담당 학급 조회 (★ 담임 배정 후 사용 가능) ==========
    // ==================================================================================
    //
    // ★ 핵심 기능: 담임으로 배정된 학급의 학생들을 조회
    //
    // [동작 흐름]
    // 1. 관리자가 Classroom 테이블에서 homeroom_teacher_id 컬럼에 교사 ID를 설정 (담임 배정)
    // 2. 교사가 getMyClassStudents() 호출
    // 3. classroomRepository.findByHomeroomTeacherIdAndYear()로 담임 학급 조회
    // 4. 해당 학급의 학생 목록 반환
    //
    // ⚠️ 담임 배정이 안 되어 있으면 "담당 학급이 없습니다" 예외 발생!
    // ==================================================================================

    /**
     * ★ 내 담임 학급 학생 조회 (담임 배정 필수!)
     *
     * - 용도: 담임 교사가 자기 반 학생 명단 확인
     * - 배정 필요: ★ 필수! (Classroom.teacher에 본인 User가 설정되어 있어야 함)
     * - 주의: teacherId는 TeacherInfo.id이며, User.uid로 변환하여 조회
     *
     * @param teacherId  교사 ID (TeacherInfo.id)
     * @param schoolYear 학년도 (예: 2025)
     * @return 담임 학급 정보 + 학생 목록
     */
    public ClassStudentDTO getMyClassStudents(Long teacherId, int schoolYear) {
        log.info("담당 반 학생 조회 - 교사 ID: {}, 학년도: {}", teacherId, schoolYear);

        // TeacherInfo.id → User.uid 변환 후 조회 (AdminService에서 User.uid로 담임 배정)
        Long userUid = getUserUidFromTeacherId(teacherId);
        Classroom classroom = classroomRepository.findByTeacherUidAndYear(userUid, schoolYear)
                .orElseThrow(() -> new IllegalArgumentException("담당 학급이 없습니다."));

        return buildClassStudentDTO(classroom);
    }

    /**
     * 특정 학급 학생 조회 (학년도/학년/반으로 검색)
     *
     * - 용도: 다른 반 학생 조회 (교무 업무, 타반 학생 성적 확인 등)
     * - 배정 필요: X (담임 여부와 무관하게 조회 가능)
     *
     * [호출 예시]
     * GET /api/teacher/class?year=2025&grade=1&classNum=3
     * → 2025학년도 1학년 3반 학생 목록 조회
     *
     * @param schoolYear 학년도 (예: 2025)
     * @param grade      학년 (1, 2, 3)
     * @param classNum   반 번호 (1, 2, 3, ...)
     * @return 해당 학급 정보 + 학생 목록
     */
    public ClassStudentDTO getClassStudents(int schoolYear, int grade, int classNum) {
        log.info("학급 학생 조회 - {}학년도 {}학년 {}반", schoolYear, grade, classNum);

        // 학년도 + 학년 + 반번호로 학급 조회
        Classroom classroom = classroomRepository.findByYearAndGradeAndClassNum(schoolYear, grade, classNum)
                .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));

        return buildClassStudentDTO(classroom);
    }

    /**
     * 학급 DTO 만드는 헬퍼 메서드 (private)
     *
     * Classroom 엔티티를 ClassStudentDTO로 변환
     * - 학급 정보 (학년도, 학년, 반, 반이름, 담임이름)
     * - 학생 목록 (학생ID, 이름, 학번, 연락처, 이메일)
     *
     * @param classroom 변환할 학급 엔티티
     * @return 학급 + 학생 목록 DTO
     */
    private ClassStudentDTO buildClassStudentDTO(Classroom classroom) {
        // 1. 해당 학급 학생들 조회 (classroom의 cid로 검색)
        List<StudentInfo> students = studentRepository.findByClassroomCid(classroom.getCid());

        // 2. 학생 엔티티 → 간단한 DTO로 변환
        List<ClassStudentDTO.StudentSimpleDTO> studentDTOs = students.stream()
                .map(s -> ClassStudentDTO.StudentSimpleDTO.builder()
                        .studentId(s.getId())
                        // User가 연결되어 있으면 User의 name 사용, 없으면 "이름없음"
                        .name(s.getUser() != null ? s.getUser().getName() : "이름없음")
                        .studentNumber(s.getStudentNumber()) // 학번
                        .phone(s.getPhone()) // 연락처
                        .email(s.getUser() != null ? s.getUser().getEmail() : null)
                        .build())
                .collect(Collectors.toList());

        // 3. 담임 이름 가져오기 (null 체크 필수)
        String homeroomName = null;
        if (classroom.getHomeroomTeacher() != null && classroom.getHomeroomTeacher().getUser() != null) {
            homeroomName = classroom.getHomeroomTeacher().getUser().getName();
        }

        // 4. 최종 DTO 빌드
        return ClassStudentDTO.builder()
                .classroomId(classroom.getCid()) // 학급 PK
                .year(classroom.getYear()) // 학년도 (2025 등)
                .grade(classroom.getGrade()) // 학년 (1, 2, 3)
                .classNum(classroom.getClassNum()) // 반 번호
                .className(classroom.getClassName()) // 반 이름 (예: "해오름반")
                .totalStudents(students.size()) // 총 학생 수
                .homeroomTeacherName(homeroomName) // 담임 이름
                .students(studentDTOs) // 학생 목록
                .build();
    }

    // ==================================================================================
    // ========== 4. 성적 입력/수정 (cheol 패키지 연동) ==========
    // ==================================================================================
    //
    // [cheol 패키지와의 연동]
    // - Grade, Subject 엔티티는 cheol 패키지에서 관리
    // - 이 서비스에서는 cheol의 Repository를 주입받아 성적 CRUD 수행
    //
    // ⚠️ 현재 문제점:
    // - 담당 과목 체크가 느슨함 (로그만 찍고 실제로 막지 않음)
    // - 담당 학급 학생인지 체크하지 않음
    //
    // TODO: 보안 강화 필요
    // - 담당 과목이 아니면 성적 입력 불가하도록 수정
    // - 담당 학급 학생만 성적 입력 가능하도록 제한 (옵션)
    // ==================================================================================

    /**
     * 성적 입력 (새 성적 등록)
     *
     * - 용도: 중간고사, 기말고사 등 시험 성적 입력
     * - 배정 필요: 담당 과목 체크는 하지만 현재 경고만 출력하고 실제로는 막지 않음
     *
     * [입력 데이터]
     * - studentId: 학생 ID
     * - subjectCode: 과목 코드 (예: "MATH101")
     * - testType: 시험 유형 (중간고사, 기말고사 등)
     * - semester: 학기 (1, 2)
     * - year: 학년도
     * - score: 점수
     *
     * @param teacherId 입력하는 교사 ID
     * @param gradeDTO  성적 입력 정보
     */
    @Transactional
    public void inputGrade(Long teacherId, GradeInputDTO gradeDTO) {
        log.info("성적 입력 - 교사: {}, 학생: {}, 과목: {}",
                teacherId, gradeDTO.getStudentId(), gradeDTO.getSubjectCode());

        // 1. 교사 존재 확인
        TeacherInfo teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다."));

        // 2. 과목 존재 확인 (과목코드로 조회)
        Subject subject = subjectRepository.findByCode(gradeDTO.getSubjectCode())
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다: " + gradeDTO.getSubjectCode()));

        // ⚠️ 담당 교사 확인 (현재는 경고만 출력, 차단하지 않음)
        // TODO: 보안 강화 시 주석 해제하여 담당 과목만 입력 가능하도록 변경
        if (subject.getTeacher() != null && !subject.getTeacher().getId().equals(teacherId)) {
            log.warn("담당 과목이 아닙니다. 교사: {}, 과목 담당: {}", teacherId, subject.getTeacher().getId());
            // throw new IllegalArgumentException("담당 과목이 아닙니다."); // ← 활성화하면 차단됨
        }

        // 3. 학생 존재 확인
        StudentInfo student = studentRepository.findById(gradeDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        // 4. 성적(Grade) 엔티티 생성 - cheol 패키지의 Grade 사용
        Grade grade = Grade.builder()
                .student(student) // 학생 (FK)
                .subject(subject) // 과목 (FK)
                .testType(gradeDTO.getTestType()) // 시험 유형 (중간/기말/수행평가 등)
                .semester(gradeDTO.getSemester()) // 학기 (1학기, 2학기)
                .year(gradeDTO.getYear()) // 학년도
                .score(gradeDTO.getScore()) // 점수
                .build();

        // 5. DB에 저장
        gradeRepository.save(grade);
        log.info("성적 입력 완료 - 학생: {}, 과목: {}, 점수: {}",
                student.getId(), subject.getName(), gradeDTO.getScore());
    }

    /**
     * 성적 수정 (점수 변경)
     *
     * - 용도: 이미 입력된 성적의 점수 수정
     * - 배정 필요: X (현재 구현) → ⚠️ 담당 과목 성적만 수정 가능하도록 제한 필요
     *
     * teacherId 수정하는 교사 ID (현재 사용 안 함 - 로그용)
     * gradeId 수정할 성적 ID
     * newScore 새 점수
     */

    @Transactional
    public void updateGrade(Long teacherId, Long gradeId, Double newScore) {
        log.info("성적 수정 - 교사: {}, 성적ID: {}, 새점수: {}", teacherId, gradeId, newScore);

        Grade grade = gradeRepository.findById(gradeId)
                .orElseThrow(() -> new IllegalArgumentException("성적을 찾을 수 없습니다."));

        // TODO: 담당 과목 체크 필요
        // if (!grade.getSubject().getTeacher().getId().equals(teacherId)) {
        // throw new IllegalArgumentException("담당 과목이 아닙니다.");
        // }

        // 점수 수정 (Dirty Checking으로 자동 UPDATE)
        grade.changeScore(newScore);
    }

    /**
     * 과목별 성적 조회 (담당 과목 전체 학생 성적)
     *
     * - 용도: 교사가 자신이 가르치는 과목의 전체 성적 조회
     * - 배정 필요: X (현재 구현) → 담당 과목만 조회 가능하도록 제한 고려
     *
     * teacherId 교사 ID (현재 로그용)
     * subjectCode 과목 코드
     * return 해당 과목의 전체 성적 목록
     */
    public List<GradeDTO> getMySubjectGrades(Long teacherId, String subjectCode) {
        log.info("과목 성적 조회 - 교사: {}, 과목: {}", teacherId, subjectCode);

        // 과목코드로 해당 과목의 모든 성적 조회 (Subject 정보도 함께 fetch)
        List<Grade> grades = gradeRepository.findBySubjectCodeWithSubject(subjectCode);

        return grades.stream()
                .map(this::entityToDto) // Grade → GradeDTO 변환
                .collect(Collectors.toList());
    }

    /**
     * 학생별 성적 조회 (특정 학생의 전 과목 성적)
     *
     * - 용도: 학생 상담, 성적표 조회 등
     * - 배정 필요: X
     *
     * @param studentId 조회할 학생 ID
     * @return 해당 학생의 전체 성적 목록
     */
    public List<GradeDTO> getStudentGrades(Long studentId) {
        log.info("학생 성적 조회 - 학생 ID: {}", studentId);

        // 학생 ID로 해당 학생의 모든 성적 조회
        List<Grade> grades = gradeRepository.findByStudentIdWithSubject(studentId);

        return grades.stream()
                .map(this::entityToDto)
                .collect(Collectors.toList());
    }

    /**
     * Grade 엔티티 → GradeDTO 변환 (private 헬퍼 메서드)
     *
     * 엔티티를 직접 반환하지 않고 DTO로 변환하는 이유:
     * 1. 순환 참조 방지 (JSON 직렬화 시 문제)
     * 2. 필요한 데이터만 전달 (보안, 성능)
     * 3. 엔티티 변경이 API 응답에 영향 주지 않도록 분리
     */
    private GradeDTO entityToDto(Grade grade) {
        return GradeDTO.builder()
                .id(grade.getId())
                .subjectName(grade.getSubject() != null ? grade.getSubject().getName() : null)
                .subjectCode(grade.getSubject() != null ? grade.getSubject().getCode() : null)
                .examType(grade.getTestType()) // 시험 유형
                .score(grade.getScore()) // 점수
                .semester(grade.getSemester()) // 학기
                .year(grade.getYear()) // 학년도
                .build();
    }

    // ==================================================================================
    // ========== 5. ★ 담임 배정 확인 및 담당 학급 관리 (NEW!) ==========
    // ==================================================================================
    //
    // ★ 담임 배정 후 사용 가능한 기능들
    //
    // [사용 흐름]
    // 1. 먼저 isHomeroom() 또는 getMyClassroom()으로 담임 배정 여부 확인
    // 2. 담임이 배정되어 있으면 담당 학급 학생 관리 기능 사용 가능
    // 3. 담임이 아니면 예외 발생 또는 빈 결과 반환
    //
    // [담임 배정은 어디서?]
    // → AdminService 또는 관리자 페이지에서 Classroom.homeroomTeacher를 설정
    // → 이 서비스에서는 배정된 결과를 조회하여 사용
    // ==================================================================================

    // ==================== 5-1. 담임 배정 확인 ====================

    /**
     * ★ 담임 배정 여부 확인 (boolean)
     *
     * - 용도: 화면에서 담임 메뉴 표시 여부 결정
     * - 반환: true = 담임 배정됨, false = 담임 아님
     * - 주의: teacherId는 TeacherInfo.id이며, User.uid로 변환하여 조회
     *
     * teacherId 교사 ID (TeacherInfo.id)
     * schoolYear 학년도
     * return 담임 여부
     */
    public boolean isHomeroom(Long teacherId, int schoolYear) {
        // TeacherInfo.id → User.uid 변환 후 조회
        Long userUid = getUserUidFromTeacherId(teacherId);
        return classroomRepository.findByTeacherUidAndYear(userUid, schoolYear).isPresent();
    }

    /**
     * ★ 내 담임 학급 정보 조회 (Optional)
     *
     * - 용도: 담임 학급 정보 확인 (예외 없이 안전하게)
     * - 반환: Optional<Classroom> - 담임이 아니면 empty
     * - 주의: teacherId는 TeacherInfo.id이며, User.uid로 변환하여 조회
     *
     * param teacherId 교사 ID (TeacherInfo.id)
     * param schoolYear 학년도
     * return 담임 학급 (없으면 Optional.empty())
     */
    public Optional<Classroom> getMyClassroom(Long teacherId, int schoolYear) {
        Long userUid = getUserUidFromTeacherId(teacherId);
        return classroomRepository.findByTeacherUidAndYear(userUid, schoolYear);
    }

    /**
     * ★ 내 담임 학급 정보 조회 (예외 발생 버전)
     *
     * - 용도: 담임 학급이 반드시 필요한 경우 (없으면 예외)
     * - 반환: Classroom - 담임이 아니면 예외 발생
     *
     * param teacherId 교사 ID (TeacherInfo.id)
     * param schoolYear 학년도
     * return 담임 학급
     * throws IllegalArgumentException 담임 배정이 안 된 경우
     */
    public Classroom getMyClassroomOrThrow(Long teacherId, int schoolYear) {
        Long userUid = getUserUidFromTeacherId(teacherId);
        return classroomRepository.findByTeacherUidAndYear(userUid, schoolYear)
                .orElseThrow(() -> new IllegalArgumentException(
                        "담당 학급이 없습니다. 관리자에게 담임 배정을 요청하세요."));
    }

    /**
     * TeacherInfo.id → User.uid 변환 (헬퍼 메서드)
     *
     * AdminService에서 담임 배정이 User.uid 기준으로 되어 있어서
     * TeacherInfo.id를 User.uid로 변환해야 조회 가능
     */
    private Long getUserUidFromTeacherId(Long teacherId) {
        TeacherInfo teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("교사를 찾을 수 없습니다. ID: " + teacherId));
        if (teacher.getUser() == null) {
            throw new IllegalArgumentException("교사의 사용자 정보가 없습니다. ID: " + teacherId);
        }
        return teacher.getUser().getUid();
    }

    // ==================== 5-2. 담당 학급 학생 관리 (담임 전용) ====================

    /**
     * ★ 담당 학급에 학생 등록 (담임 전용)
     *
     * - 용도: 담임 교사가 자기 반에만 학생 추가
     * - 배정 필요: ★ 필수! (담임이 아니면 예외 발생)
     * - 기존 createStudent()와의 차이: classroomId를 자동으로 담당 학급으로 설정
     *
     * [동작 흐름]
     * 1. teacherId로 담임 학급 조회
     * 2. 담임 학급이 없으면 예외 발생
     * 3. 학생 생성 시 담임 학급의 classroomId 자동 설정
     *
     * param teacherId  교사 ID (담임 교사)
     * param schoolYear 학년도
     * param createDTO  학생 생성 정보 (classroomId는 무시됨 - 자동 설정)
     * return 생성된 학생 정보
     */
    @Transactional
    public StudentResponseDTO createStudentInMyClass(Long teacherId, int schoolYear, StudentCreateDTO createDTO) {
        log.info("담당 학급에 학생 등록 - 교사: {}, 학년도: {}", teacherId, schoolYear);

        // 1. 담임 학급 조회 (없으면 예외)
        Classroom myClassroom = getMyClassroomOrThrow(teacherId, schoolYear);

        // 2. 학번 중복 체크
        if (studentRepository.findByStudentNumber(createDTO.getStudentNumber()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 학번입니다: " + createDTO.getStudentNumber());
        }

        // 3. 학생 생성 (담당 학급으로 자동 배정)
        StudentInfo student = new StudentInfo();
        student.setStudentNumber(createDTO.getStudentNumber());
        student.setClassroom(myClassroom); // ★ 담당 학급으로 자동 설정!
        student.setBirthDate(createDTO.getBirthDate());
        student.setAddress(createDTO.getAddress());
        student.setPhone(createDTO.getPhone());
        student.setGender(createDTO.getGender());

        StudentInfo savedStudent = studentRepository.save(student);
        log.info("담당 학급에 학생 등록 완료 - 학생: {}, 학급: {}",
                savedStudent.getStudentNumber(), myClassroom.getClassName());

        return new StudentResponseDTO(savedStudent);
    }

    /**
     * ★ 담당 학급 학생 정보 수정 (담임 전용)
     *
     * - 용도: 담임 교사가 자기 반 학생만 수정
     * - 배정 필요: ★ 필수! (담임이 아니거나 담당 학급 학생이 아니면 예외)
     * - 기존 updateStudent()와의 차이: 담당 학급 학생인지 검증
     *
     * param teacherId 교사 ID
     * param schoolYear 학년도
     * param studentId 수정할 학생 ID
     * param updateDTO 수정할 정보
     * return 수정된 학생 정보
     */
    @Transactional
    public StudentResponseDTO updateMyClassStudent(Long teacherId, int schoolYear, Long studentId,
            StudentUpdateDTO updateDTO) {
        log.info("담당 학급 학생 수정 - 교사: {}, 학생: {}", teacherId, studentId);

        // 1. 담임 학급 조회 (없으면 예외)
        Classroom myClassroom = getMyClassroomOrThrow(teacherId, schoolYear);

        // 2. 학생 조회
        StudentInfo student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        // 3. ★ 담당 학급 학생인지 검증!
        if (student.getClassroom() == null || !student.getClassroom().getCid().equals(myClassroom.getCid())) {
            throw new IllegalArgumentException("담당 학급 학생이 아닙니다. 본인 반 학생만 수정할 수 있습니다.");
        }

        // 4. 정보 수정 (Dirty Checking)
        // 주의: classroomId 변경은 허용하지 않음 (다른 반으로 이동 불가)
        if (updateDTO.getClassroomId() != null) {
            log.warn("담당 학급 학생 수정 시 반 이동은 불가합니다. classroomId 무시됨.");
            // 반 이동은 관리자 권한 필요 - 여기서는 무시
        }
        if (updateDTO.getBirthDate() != null) {
            student.setBirthDate(updateDTO.getBirthDate());
        }
        if (updateDTO.getAddress() != null) {
            student.setAddress(updateDTO.getAddress());
        }
        if (updateDTO.getPhone() != null) {
            student.setPhone(updateDTO.getPhone());
        }
        if (updateDTO.getGender() != null) {
            student.setGender(updateDTO.getGender());
        }

        log.info("담당 학급 학생 수정 완료 - 학생: {}", studentId);
        return new StudentResponseDTO(student);
    }

    /**
     * ★ 담당 학급 학생 삭제 (담임 전용 - 소프트 삭제)
     *
     * - 용도: 담임 교사가 자기 반 학생만 삭제(자퇴 처리)
     * - 배정 필요: ★ 필수!
     *
     * param teacherId 교사 ID
     * param schoolYear 학년도
     * param studentId 삭제할 학생 ID
     */
    @Transactional
    public void deleteMyClassStudent(Long teacherId, int schoolYear, Long studentId) {
        log.info("담당 학급 학생 삭제(자퇴) - 교사: {}, 학생: {}", teacherId, studentId);

        // 1. 담임 학급 조회
        Classroom myClassroom = getMyClassroomOrThrow(teacherId, schoolYear);

        // 2. 학생 조회
        StudentInfo student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다. ID: " + studentId));

        // 3. 담당 학급 학생인지 검증
        if (student.getClassroom() == null || !student.getClassroom().getCid().equals(myClassroom.getCid())) {
            throw new IllegalArgumentException("담당 학급 학생이 아닙니다. 본인 반 학생만 삭제할 수 있습니다.");
        }

        // 4. 소프트 삭제
        student.setStatus(StudentStatus.DROPOUT);
        log.info("담당 학급 학생 삭제(자퇴) 완료 - 학생: {}", studentId);
    }

    // ==================== 5-3. 담당 학급 학생 성적 입력 (담임 전용) ====================

    /**
     * ★ 담당 학급 학생 성적 입력 (담임 전용)
     *
     * - 용도: 담임 교사가 자기 반 학생의 성적만 입력
     * - 배정 필요: ★ 필수! (담당 학급 학생이 아니면 예외)
     * - 기존 inputGrade()와의 차이: 담당 학급 학생인지 검증 추가
     *
     * param teacherId 교사 ID
     * param schoolYear 학년도
     * param gradeDTO 성적 입력 정보
     */
    @Transactional
    public void inputGradeForMyClass(Long teacherId, int schoolYear, GradeInputDTO gradeDTO) {
        log.info("담당 학급 학생 성적 입력 - 교사: {}, 학생: {}", teacherId, gradeDTO.getStudentId());

        // 1. 담임 학급 조회
        Classroom myClassroom = getMyClassroomOrThrow(teacherId, schoolYear);

        // 2. 학생 조회 및 담당 학급 검증
        StudentInfo student = studentRepository.findById(gradeDTO.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        if (student.getClassroom() == null || !student.getClassroom().getCid().equals(myClassroom.getCid())) {
            throw new IllegalArgumentException("담당 학급 학생이 아닙니다. 본인 반 학생의 성적만 입력할 수 있습니다.");
        }

        // 3. 과목 조회
        Subject subject = subjectRepository.findByCode(gradeDTO.getSubjectCode())
                .orElseThrow(() -> new IllegalArgumentException("과목을 찾을 수 없습니다: " + gradeDTO.getSubjectCode()));

        // 4. 성적 생성 및 저장
        Grade grade = Grade.builder()
                .student(student)
                .subject(subject)
                .testType(gradeDTO.getTestType())
                .semester(gradeDTO.getSemester())
                .year(gradeDTO.getYear())
                .score(gradeDTO.getScore())
                .build();

        gradeRepository.save(grade);
        log.info("담당 학급 학생 성적 입력 완료 - 학생: {}, 과목: {}, 점수: {}",
                student.getId(), subject.getName(), gradeDTO.getScore());
    }

    /**
     * ★ 담당 학급 학생인지 확인 (헬퍼 메서드)
     *
     * - 용도: 특정 학생이 내 담당 학급 학생인지 확인
     *
     * param teacherId  교사 ID
     * param schoolYear 학년도
     * param studentId  학생 ID
     * return true = 담당 학급 학생, false = 아님
     */
    public boolean isMyClassStudent(Long teacherId, int schoolYear, Long studentId) {
        Optional<Classroom> myClassroom = getMyClassroom(teacherId, schoolYear);
        if (myClassroom.isEmpty()) {
            return false;
        }

        Optional<StudentInfo> student = studentRepository.findById(studentId);
        if (student.isEmpty() || student.get().getClassroom() == null) {
            return false;
        }

        return student.get().getClassroom().getCid().equals(myClassroom.get().getCid());
    }
}

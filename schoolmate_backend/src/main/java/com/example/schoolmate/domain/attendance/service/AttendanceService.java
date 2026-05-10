package com.example.schoolmate.domain.attendance.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.attendance.entity.constant.AttendanceStatus;
import com.example.schoolmate.domain.parent.entity.FamilyRelation;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.student.entity.StudentAssignment;
import com.example.schoolmate.domain.classroom.repository.ClassroomRepository;
import com.example.schoolmate.domain.parent.repository.FamilyRelationRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.teacher.service.TeacherService;
import com.example.schoolmate.global.util.NotificationHelper;
import com.example.schoolmate.domain.attendance.dto.AttendanceDTO;
import com.example.schoolmate.domain.attendance.entity.StudentAttendance;
import com.example.schoolmate.domain.attendance.entity.TeacherAttendance;
import com.example.schoolmate.domain.attendance.repository.AttendanceRepository;
import com.example.schoolmate.domain.attendance.repository.TeacherAttendanceRepository;
import com.example.schoolmate.schoolmate_backend_app.service.ExpoPushService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// [woo] 출결 관리 서비스 - 교사가 담당 학생 출결 관리, 학부모가 자녀 출결 조회
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final TeacherAttendanceRepository teacherAttendanceRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final ClassroomRepository classroomRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final TeacherService teacherService;
    private final ExpoPushService expoPushService; // [woo] FCM 푸시 알림

    // ========== [woo] 학생 출결 (담임 교사용 - Classroom 기반) ==========

    /**
     * [woo] 담임 반 학생 출결 목록 조회
     * 출결 기록이 없는 학생도 "미처리" 상태로 포함하여 반환
     */
    public List<AttendanceDTO.StudentAttendanceResponse> getStudentAttendanceByTeacher(
            Long teacherUid, LocalDate date) {

        List<StudentInfo> myStudents = getMyClassStudents(teacherUid, date.getYear());

        if (myStudents.isEmpty()) {
            log.warn("[woo] 담임 반 학생이 없습니다 - teacherUid: {}, year: {}", teacherUid, date.getYear());
            return List.of();
        }

        Set<Long> myStudentIds = myStudents.stream()
                .map(StudentInfo::getId)
                .collect(Collectors.toSet());

        // [woo] 기존 출결 기록 조회
        List<StudentAttendance> attendances = attendanceRepository
                .findByStudentInfoIdInAndAttendanceDate(myStudentIds, date);

        Map<Long, StudentAttendance> attendanceMap = attendances.stream()
                .collect(Collectors.toMap(sa -> sa.getStudentInfo().getId(), sa -> sa));

        // [woo] 전체 학생 목록 반환 (기록 없으면 미처리)
        return myStudents.stream()
                .map(si -> {
                    StudentAttendance sa = attendanceMap.get(si.getId());
                    StudentAssignment assignment = si.getCurrentAssignment();
                    if (sa != null) {
                        return toStudentResponse(sa);
                    } else {
                        // [woo] 출결 기록 없는 학생 → 미처리 상태로 표시
                        return AttendanceDTO.StudentAttendanceResponse.builder()
                                .id(0L) // 아직 record 없음
                                .studentInfoId(si.getId())
                                .studentName(si.getUser().getName())
                                .studentNumber(si.getFullStudentNumber())
                                .year(assignment != null ? assignment.getGrade() : 0)
                                .classNum(assignment != null ? assignment.getClassNum() : 0)
                                .date(date.toString())
                                .status("NONE")
                                .statusDesc("미처리")
                                .reason(null)
                                .build();
                    }
                })
                .collect(Collectors.toList());
    }

    /**
     * [woo] 학생 출결 상태 변경 (studentInfoId + date 기반 - 기록 없으면 생성)
     */
    @Transactional
    public void updateStudentAttendanceByStudentInfo(Long studentInfoId, LocalDate date, String status, String reason) {
        AttendanceStatus newStatus = AttendanceStatus.valueOf(status);
        StudentInfo student = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다: " + studentInfoId));

        // [woo] 기존 기록 찾기, 없으면 새로 생성
        List<StudentAttendance> existing = attendanceRepository
                .findByStudentAndDateRange(studentInfoId, date, date);

        if (!existing.isEmpty()) {
            StudentAttendance attendance = existing.get(0);
            attendance.setStatus(newStatus);
            attendance.setReason(reason);
            if (newStatus == AttendanceStatus.PRESENT) {
                attendance.setCheckInTime(LocalTime.now());
            }
        } else {
            StudentAttendance attendance = StudentAttendance.builder()
                    .studentInfo(student)
                    .attendanceDate(date)
                    .status(newStatus)
                    .checkInTime(newStatus == AttendanceStatus.PRESENT ? LocalTime.now() : null)
                    .reason(reason)
                    .build();
            attendance.setSchool(student.getSchool());
            attendanceRepository.save(attendance);
        }

        // [woo] 출결 변경 시 학부모에게 푸시 알림 (출석 제외 — 결석/지각/조퇴/병결만)
        if (newStatus != AttendanceStatus.PRESENT) {
            notifyParentsOfAttendance(student, date, newStatus, reason);
        }
    }

    /**
     * [woo] 학생 출결 상태 변경 시 해당 학생의 모든 학부모에게 알림 발송
     * FamilyRelation을 통해 학부모 조회 후 NotificationHelper로 푸시 + DB 저장
     */
    private void notifyParentsOfAttendance(StudentInfo student, LocalDate date, AttendanceStatus status, String reason) {
        String studentName = student.getUser().getName();
        String statusDesc = switch (status) {
            case ABSENT      -> "결석";
            case LATE         -> "지각";
            case EARLY_LEAVE  -> "조퇴";
            case SICK         -> "병결";
            default           -> status.name();
        };

        String title = studentName + " 학생 출결 알림";
        String content = String.format("%s(%s) %s 학생이 %s 처리되었습니다.",
                date.getMonthValue() + "월 " + date.getDayOfMonth() + "일",
                switch (date.getDayOfWeek()) {
                    case MONDAY -> "월"; case TUESDAY -> "화"; case WEDNESDAY -> "수";
                    case THURSDAY -> "목"; case FRIDAY -> "금"; case SATURDAY -> "토"; case SUNDAY -> "일";
                },
                studentName, statusDesc);
        if (reason != null && !reason.isBlank()) {
            content += " (사유: " + reason + ")";
        }

        // [woo] FamilyRelation을 통해 학부모 찾기
        List<FamilyRelation> relations = familyRelationRepository
                .findByStudentInfo_User_Uid(student.getUser().getUid());

        String actionUrl = "/parent/attendance";
        for (FamilyRelation rel : relations) {
            if (rel.getParentInfo() != null && rel.getParentInfo().getUser() != null) {
                // [woo] 1) DB 알림 저장
                NotificationHelper.send(
                        null,
                        rel.getParentInfo().getUser(),
                        title,
                        content,
                        actionUrl
                );
                // [woo] Expo FCM은 NotificationHelper → NotificationService에서 자동 발송
            }
        }

        if (!relations.isEmpty()) {
            log.info("[woo] 출결 알림 발송 - student: {}, status: {}, parents: {}명",
                    studentName, statusDesc, relations.size());
        }
    }

    /**
     * [woo] 전원출석 처리 - 담임 반 학생 전원을 출석으로 일괄 처리
     */
    @Transactional
    public int markAllPresent(Long teacherUid, LocalDate date) {
        List<StudentInfo> myStudents = getMyClassStudents(teacherUid, date.getYear());
        int count = 0;

        for (StudentInfo student : myStudents) {
            List<StudentAttendance> existing = attendanceRepository
                    .findByStudentAndDateRange(student.getId(), date, date);

            if (!existing.isEmpty()) {
                StudentAttendance sa = existing.get(0);
                sa.setStatus(AttendanceStatus.PRESENT);
                sa.setCheckInTime(LocalTime.now());
                sa.setReason(null);
            } else {
                StudentAttendance attendance = StudentAttendance.builder()
                        .studentInfo(student)
                        .attendanceDate(date)
                        .status(AttendanceStatus.PRESENT)
                        .checkInTime(LocalTime.now())
                        .build();
                attendance.setSchool(student.getSchool());
                attendanceRepository.save(attendance);
            }
            count++;
        }
        return count;
    }

    /**
     * [woo] 교사의 담임 반 학생 목록 조회
     * TeacherService.getMyClassroom()과 동일한 로직 사용 (teacherInfoId 기반)
     */
    private List<StudentInfo> getMyClassStudents(Long teacherUid, int year) {
        // [woo] teacherUid(User.uid) → TeacherInfo.id 변환
        TeacherInfo teacher = teacherInfoRepository.findByUserUid(teacherUid).orElse(null);
        if (teacher == null) {
            log.warn("[woo] 교사 정보 없음 - teacherUid: {}", teacherUid);
            return List.of();
        }

        // [woo] TeacherService와 동일: teacherInfoId → userUid → findByTeacherUidAndYear
        java.util.Optional<Classroom> classroomOpt = teacherService.getMyClassroom(teacher.getId(), year);

        return classroomOpt
                .map(classroom -> {
                    log.info("[woo] 담임 반 찾음 - {}학년 {}반 (cid={})",
                            classroom.getGrade(), classroom.getClassNum(), classroom.getCid());
                    // [woo] CURRENT status 의존 제거 → 학년도 숫자로 직접 필터
                    List<StudentInfo> students = studentInfoRepository
                            .findByClassroomIdAndSchoolYear(classroom.getCid(), year);
                    if (students.isEmpty()) {
                        // [woo] 폴백: 학년도 무관 조회 (테스트/개발 환경 대비)
                        log.warn("[woo] 학년도({}) 필터 결과 없음 → 전체 조회로 폴백 (cid={})", year, classroom.getCid());
                        students = studentInfoRepository.findByClassroomId(classroom.getCid());
                    }
                    log.info("[woo] 담임 반 학생 {}명 조회됨", students.size());
                    return students;
                })
                .orElseGet(() -> {
                    log.warn("[woo] 담임 반을 찾을 수 없음 - teacherId: {}, year: {}", teacher.getId(), year);
                    return List.of();
                });
    }

    // ========== [woo] 교사 출근 관리 (관리자용) ==========

    /**
     * 교사 출근 목록 조회 (관리자가 학교 전체 교사 조회)
     */
    public List<AttendanceDTO.TeacherAttendanceResponse> getTeacherAttendanceList(
            Long schoolId, LocalDate date) {

        List<TeacherAttendance> attendances = teacherAttendanceRepository
                .findByDateAndSchool(date, schoolId);

        return attendances.stream()
                .map(this::toTeacherResponse)
                .collect(Collectors.toList());
    }

    /**
     * 교사 출근 상태 변경 (관리자)
     */
    @Transactional
    public void updateTeacherAttendanceStatus(Long attendanceId, String status, String reason) {
        TeacherAttendance attendance = teacherAttendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new IllegalArgumentException("교사 출결 기록을 찾을 수 없습니다: " + attendanceId));

        AttendanceStatus newStatus = AttendanceStatus.valueOf(status);
        attendance.setStatus(newStatus);
        if (reason != null) {
            attendance.setReason(reason);
        }
    }

    /**
     * 교사 출근 일괄 초기화 (관리자)
     */
    @Transactional
    public void initializeDailyTeacherAttendance(Long schoolId, LocalDate date) {
        List<TeacherInfo> teachers = teacherInfoRepository.findAll().stream()
                .filter(t -> t.getSchool() != null && t.getSchool().getId().equals(schoolId))
                .collect(Collectors.toList());

        for (TeacherInfo teacher : teachers) {
            if (!teacherAttendanceRepository.existsByTeacherInfoIdAndAttendanceDate(teacher.getId(), date)) {
                TeacherAttendance attendance = TeacherAttendance.builder()
                        .teacherInfo(teacher)
                        .attendanceDate(date)
                        .status(AttendanceStatus.PRESENT)
                        .checkInTime(LocalTime.of(8, 0))
                        .build();
                attendance.setSchool(teacher.getSchool());
                teacherAttendanceRepository.save(attendance);
            }
        }
    }

    // ========== [woo] 학부모용 자녀 출결 조회 ==========

    /**
     * 학부모의 자녀 출결 요약 조회
     */
    public List<AttendanceDTO.ChildAttendanceSummary> getChildrenAttendanceSummary(
            Long parentUid, LocalDate startDate, LocalDate endDate) {

        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(parentUid);

        return relations.stream()
                .map(rel -> {
                    StudentInfo student = rel.getStudentInfo();
                    List<StudentAttendance> attendances = attendanceRepository
                            .findByStudentAndDateRange(student.getId(), startDate, endDate);

                    // [woo] 상태별 카운트
                    Map<String, Long> statusCounts = new LinkedHashMap<>();
                    for (AttendanceStatus s : AttendanceStatus.values()) {
                        if (s == AttendanceStatus.LEAVE) continue; // 교사 전용
                        long count = attendances.stream()
                                .filter(a -> a.getStatus() == s).count();
                        statusCounts.put(s.name(), count);
                    }

                    StudentAssignment assignment = student.getCurrentAssignment();
                    int grade = assignment != null ? assignment.getGrade() : 0;
                    int classNum = assignment != null ? assignment.getClassNum() : 0;

                    return AttendanceDTO.ChildAttendanceSummary.builder()
                            .childName(student.getUser().getName())
                            .studentInfoId(student.getId())
                            .studentNumber(student.getFullStudentNumber())
                            .grade(grade)
                            .classNum(classNum)
                            .statusCounts(statusCounts)
                            .totalDays(attendances.size())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 학부모의 특정 자녀 출결 상세 기록 조회
     */
    public List<AttendanceDTO.ChildAttendanceRecord> getChildAttendanceRecords(
            Long parentUid, Long studentInfoId, LocalDate startDate, LocalDate endDate) {

        // [woo] 학부모-학생 관계 검증
        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(parentUid);
        boolean isParentOfStudent = relations.stream()
                .anyMatch(r -> r.getStudentInfo().getId().equals(studentInfoId));

        if (!isParentOfStudent) {
            throw new IllegalArgumentException("해당 학생의 학부모가 아닙니다.");
        }

        List<StudentAttendance> attendances = attendanceRepository
                .findByStudentAndDateRange(studentInfoId, startDate, endDate);

        return attendances.stream()
                .map(a -> AttendanceDTO.ChildAttendanceRecord.builder()
                        .id(a.getId())
                        .attendanceDate(a.getAttendanceDate())
                        .status(a.getStatus().name())
                        .statusDesc(AttendanceDTO.getStatusDesc(a.getStatus()))
                        .checkInTime(a.getCheckInTime())
                        .reason(a.getReason())
                        .build())
                .collect(Collectors.toList());
    }

    // ========== [woo] 교사용 월별 출결 처리 일수 ==========

    /**
     * [woo] 이번 달 출결 처리된 일수 (교사 사이드바/헤더용)
     */
    public long getProcessedDaysCount(Long teacherUid, LocalDate startDate, LocalDate endDate) {
        List<StudentInfo> myStudents = getMyClassStudents(teacherUid, startDate.getYear());
        if (myStudents.isEmpty()) return 0;

        Set<Long> studentIds = myStudents.stream()
                .map(StudentInfo::getId)
                .collect(Collectors.toSet());

        return attendanceRepository.countDistinctDatesByStudentInfoIds(studentIds, startDate, endDate);
    }

    // ========== [soojin] 담임 반 월별 출석률 ==========

    /**
     * [soojin] 담임 반의 해당 월 전체 출석률 계산
     * NONE(미처리) 제외, 처리된 기록 중 PRESENT 비율
     */
    public Map<String, Object> getMonthlyAttendanceStats(Long teacherUid, int year, int month) {
        List<StudentInfo> myStudents = getMyClassStudents(teacherUid, year);
        if (myStudents.isEmpty()) return Map.of("rate", 0, "presentCount", 0L, "totalCount", 0L);

        Set<Long> studentIds = myStudents.stream()
                .map(StudentInfo::getId)
                .collect(Collectors.toSet());

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        if (endDate.isAfter(LocalDate.now())) endDate = LocalDate.now();

        List<StudentAttendance> records = attendanceRepository
                .findByStudentInfoIdsAndDateRange(studentIds, startDate, endDate);

        // [soojin] status는 nullable=false라 NONE 없음 → 전체 레코드가 처리된 기록
        long total = records.size();
        long present  = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long late     = records.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
        long earlyLeave = records.stream().filter(r -> r.getStatus() == AttendanceStatus.EARLY_LEAVE).count();
        long absent   = records.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
        long sick     = records.stream().filter(r -> r.getStatus() == AttendanceStatus.SICK).count();
        int rate = total > 0 ? (int) Math.round(present * 100.0 / total) : 0;

        // [soojin] 각 상태별 카운트 추가 반환
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("rate", rate);
        result.put("presentCount", present);
        result.put("lateCount", late);
        result.put("earlyLeaveCount", earlyLeave);
        result.put("absentCount", absent);
        result.put("sickCount", sick);
        result.put("totalCount", total);
        return result;
    }

    // ========== [woo] 학생 본인 출결 요약 ==========

    /**
     * [woo] 학생 본인의 출결 통계 (사이드바용)
     */
    public Map<String, Object> getMyAttendanceSummary(Long studentInfoId, LocalDate startDate, LocalDate endDate) {
        List<StudentAttendance> attendances = attendanceRepository
                .findByStudentAndDateRange(studentInfoId, startDate, endDate);

        Map<String, Object> result = new LinkedHashMap<>();
        for (AttendanceStatus s : AttendanceStatus.values()) {
            if (s == AttendanceStatus.LEAVE) continue;
            long count = attendances.stream()
                    .filter(a -> a.getStatus() == s).count();
            result.put(s.name(), count);
        }
        // [woo] 총 출결 처리일
        result.put("totalDays", (long) attendances.size());
        return result;
    }

    // ========== [woo] 내부 변환 메서드 ==========

    private AttendanceDTO.StudentAttendanceResponse toStudentResponse(StudentAttendance sa) {
        StudentInfo si = sa.getStudentInfo();
        StudentAssignment assignment = si.getCurrentAssignment();

        return AttendanceDTO.StudentAttendanceResponse.builder()
                .id(sa.getId())
                .studentInfoId(si.getId())
                .studentName(si.getUser().getName())
                .studentNumber(si.getFullStudentNumber())
                .year(assignment != null ? assignment.getGrade() : 0)
                .classNum(assignment != null ? assignment.getClassNum() : 0)
                .date(sa.getAttendanceDate().toString())
                .status(sa.getStatus().name())
                .statusDesc(AttendanceDTO.getStatusDesc(sa.getStatus()))
                .reason(sa.getReason())
                .build();
    }

    private AttendanceDTO.TeacherAttendanceResponse toTeacherResponse(TeacherAttendance ta) {
        TeacherInfo ti = ta.getTeacherInfo();

        return AttendanceDTO.TeacherAttendanceResponse.builder()
                .id(ta.getId())
                .teacherName(ti.getUser().getName())
                .teacherCode(ti.getCode())
                .department(ti.getDepartment())
                .date(ta.getAttendanceDate().toString())
                .status(ta.getStatus().name())
                .statusDesc(AttendanceDTO.getStatusDesc(ta.getStatus()))
                .reason(ta.getReason())
                .build();
    }
}

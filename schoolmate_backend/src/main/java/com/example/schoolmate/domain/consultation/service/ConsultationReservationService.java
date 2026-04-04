package com.example.schoolmate.domain.consultation.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.domain.parent.entity.FamilyRelation;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.student.entity.StudentAssignment;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.parent.repository.FamilyRelationRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.consultation.dto.ReservationDTO;
import com.example.schoolmate.domain.consultation.entity.ConsultationReservation;
import com.example.schoolmate.domain.consultation.entity.ConsultationType;
import com.example.schoolmate.domain.consultation.entity.ReservationStatus;
import com.example.schoolmate.domain.consultation.repository.ConsultationReservationRepository;

import lombok.RequiredArgsConstructor;

// [soojin] 상담 예약 서비스
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConsultationReservationService {

    private final ConsultationReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final StudentInfoRepository studentInfoRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // 날짜 범위로 예약 조회 (캘린더 뷰) - 교사: 담당 반만, 학부모: 자녀 반만, 관리자: 전체
    public List<ReservationDTO.Response> getByDateRange(LocalDate startDate, LocalDate endDate,
                                                        Long teacherUid, Long studentUserUid, Long parentUid) {
        List<ConsultationReservation> list;
        if (teacherUid != null) {
            list = reservationRepository.findByTeacherUidAndDateBetween(teacherUid, startDate, endDate);
        } else if (studentUserUid != null) {
            // 학부모: 자녀의 학급 기준으로 필터
            StudentInfo si = studentInfoRepository.findByUserUid(studentUserUid).orElse(null);
            if (si != null && si.getCurrentAssignment() != null
                    && si.getCurrentAssignment().getClassroom() != null) {
                Long classroomId = si.getCurrentAssignment().getClassroom().getCid();
                list = reservationRepository.findByClassroomIdAndDateBetween(classroomId, startDate, endDate);
            } else {
                list = List.of();
            }
        } else {
            list = reservationRepository.findByDateBetween(startDate, endDate);
        }
        return list.stream().map(r -> toResponse(r, studentUserUid, parentUid)).collect(Collectors.toList());
    }

    // 내 예약 목록
    // TEACHER: 담당 반 학생 상담만 / PARENT: 선택 자녀(studentInfoId) 상담만 / ADMIN: 전체
    public List<ReservationDTO.Response> getMyReservations(Long uid, String role, Long studentUserUid) {
        List<ConsultationReservation> list;
        if ("TEACHER".equals(role)) {
            list = reservationRepository.findByTeacherUidOrderByDateDescStartTimeDesc(uid);
        } else if ("ADMIN".equals(role)) {
            list = reservationRepository.findAllByOrderByDateDescStartTimeDesc();
        } else if (studentUserUid != null) {
            list = reservationRepository.findByStudentInfo_User_UidOrderByDateDescStartTimeDesc(studentUserUid);
        } else {
            list = reservationRepository.findByWriter_UidOrderByDateDescStartTimeDesc(uid);
        }
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // 예약 생성
    @Transactional
    public ReservationDTO.Response create(Long uid, ReservationDTO.CreateRequest req) {
        User writer = userRepository.findById(uid)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        ConsultationReservation reservation = new ConsultationReservation();
        reservation.setDate(req.getDate());
        reservation.setStartTime(req.getStartTime());
        reservation.setEndTime(req.getEndTime());
        reservation.setContent(req.getContent());
        reservation.setWriter(writer);
        reservation.setStatus(ReservationStatus.PENDING);
        if (req.getConsultationType() != null) {
            try {
                reservation.setConsultationType(ConsultationType.valueOf(req.getConsultationType()));
            } catch (IllegalArgumentException ignored) {}
        }

        // 자녀 선택 (studentUserUid: 자녀의 User uid)
        if (req.getStudentUserUid() != null) {
            List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(uid);
            relations.stream()
                    .filter(r -> r.getStudentInfo().getUser() != null
                            && r.getStudentInfo().getUser().getUid().equals(req.getStudentUserUid()))
                    .findFirst()
                    .ifPresent(r -> reservation.setStudentInfo(r.getStudentInfo()));
        }

        ConsultationReservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    // 예약 취소 (PENDING만, 본인만)
    @Transactional
    public void cancel(Long id, Long uid) {
        ConsultationReservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));
        if (!reservation.getWriter().getUid().equals(uid)) {
            throw new RuntimeException("본인의 예약만 취소할 수 있습니다.");
        }
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new RuntimeException("대기 중인 예약만 취소할 수 있습니다.");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
    }

    // [soojin] 예약 완료 처리 (교사) - CONFIRMED → COMPLETED
    @Transactional
    public ReservationDTO.Response complete(Long id) {
        ConsultationReservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));
        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new RuntimeException("확정된 예약만 완료 처리할 수 있습니다.");
        }
        reservation.setStatus(ReservationStatus.COMPLETED);
        return toResponse(reservation);
    }

    // [soojin] 교사 취소 - PENDING / CONFIRMED → CANCELLED
    @Transactional
    public void teacherCancel(Long id) {
        ConsultationReservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));
        if (reservation.getStatus() != ReservationStatus.PENDING
                && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new RuntimeException("대기 중이거나 확정된 예약만 취소할 수 있습니다.");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
    }

    // [soojin] 예약 확정 (교사) - 일정 조정 가능 (PENDING → 확정, CONFIRMED → 일정 변경)
    @Transactional
    public ReservationDTO.Response confirm(Long id, ReservationDTO.ConfirmRequest req) {
        ConsultationReservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));
        if (reservation.getStatus() != ReservationStatus.PENDING
                && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new RuntimeException("대기 중이거나 확정된 예약만 조정할 수 있습니다.");
        }
        // 교사가 일정을 조정한 경우
        if (req != null) {
            if (req.getDate() != null) reservation.setDate(req.getDate());
            if (req.getStartTime() != null) reservation.setStartTime(req.getStartTime());
            if (req.getEndTime() != null) reservation.setEndTime(req.getEndTime());
        }
        reservation.setStatus(ReservationStatus.CONFIRMED);
        return toResponse(reservation);
    }

    // 학부모의 자녀 목록 조회
    public List<ReservationDTO.ChildInfo> getChildren(Long uid) {
        List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(uid);
        return relations.stream().map(r -> {
            StudentInfo si = r.getStudentInfo();
            User studentUser = si.getUser();
            StudentAssignment ca = si.getCurrentAssignment();
            return ReservationDTO.ChildInfo.builder()
                    .id(studentUser != null ? studentUser.getUid() : si.getId())
                    .name(studentUser != null ? studentUser.getName() : "-")
                    .grade(ca != null ? ca.getGrade() : null)
                    .classNum(ca != null ? ca.getClassNum() : null)
                    .number(ca != null ? ca.getAttendanceNum() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    private ReservationDTO.Response toResponse(ConsultationReservation r) {
        return toResponse(r, null, null);
    }

    private ReservationDTO.Response toResponse(ConsultationReservation r, Long studentUserUid, Long parentUid) {
        String writerName = r.getWriter() != null ? r.getWriter().getName() : "-";
        String studentName = null;
        String studentNumber = null;
        if (r.getStudentInfo() != null) {
            StudentInfo si = r.getStudentInfo();
            studentName = si.getUser() != null ? si.getUser().getName() : "-";
            studentNumber = si.getFullStudentNumber();
        }
        String createDateStr = r.getCreateDate() != null
                ? r.getCreateDate().format(DATE_FMT)
                : null;

        // 자녀 uid 일치 또는 작성자(학부모) uid 일치 시 본인 예약으로 판단
        boolean isMine = (studentUserUid != null
                && r.getStudentInfo() != null
                && r.getStudentInfo().getUser() != null
                && r.getStudentInfo().getUser().getUid().equals(studentUserUid))
                || (parentUid != null
                && r.getWriter() != null
                && r.getWriter().getUid().equals(parentUid));

        return ReservationDTO.Response.builder()
                .id(r.getId())
                .date(r.getDate())
                .startTime(r.getStartTime())
                .endTime(r.getEndTime())
                .writerName(writerName)
                .content(r.getContent())
                .status(r.getStatus().name())
                .studentName(studentName)
                .studentNumber(studentNumber)
                .createDate(createDateStr)
                .consultationType(r.getConsultationType() != null ? r.getConsultationType().name() : null)
                .isMine(isMine)
                .build();
    }
}

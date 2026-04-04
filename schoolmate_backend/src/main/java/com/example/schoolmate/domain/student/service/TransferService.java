package com.example.schoolmate.domain.student.service;
import com.example.schoolmate.domain.school.service.CodeSequenceService;

import com.example.schoolmate.domain.student.dto.TransferDTO;
import com.example.schoolmate.global.entity.SchoolMemberInfo;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.staff.entity.StaffInfo;
import com.example.schoolmate.domain.student.entity.constant.StudentStatus;
import com.example.schoolmate.domain.teacher.entity.constant.TeacherStatus;
import com.example.schoolmate.domain.staff.entity.constant.StaffStatus;
import com.example.schoolmate.domain.user.entity.RoleRequest;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.UserRole;
import com.example.schoolmate.domain.user.repository.RoleRequestRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.domain.staff.repository.StaffInfoRepository;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 전입 처리 서비스
 *
 * 학생/교사/교직원을 다른 학교로 전입시킵니다.
 *
 * 처리 순서:
 * 1. 전출 학교의 info 상태를 TRANSFERRED로 변경하고 primary 해제
 * 2. 전입 학교의 새 info 생성 (primary=true, 기본 상태)
 * 3. 전입 학교에 대해 즉시 ACTIVE RoleRequest 생성
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TransferService {

    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StaffInfoRepository staffInfoRepository;
    private final SchoolRepository schoolRepository;
    private final RoleRequestRepository roleRequestRepository;
    private final CodeSequenceService codeSequenceService;

    /**
     * 전입 대상 검색 (학교 + 역할 + 이름/코드 키워드)
     *
     * @param schoolId  검색할 학교 ID
     * @param role      역할 (STUDENT | TEACHER | STAFF)
     * @param keyword   이름 또는 코드 검색어 (null 이면 전체 조회)
     */
    @Transactional(readOnly = true)
    public List<TransferDTO.MemberSummary> search(Long schoolId, String role, String keyword) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.toLowerCase() : null;

        return switch (role.toUpperCase()) {
            case "STUDENT" -> studentInfoRepository.findBySchoolId(schoolId).stream()
                    .filter(i -> i.getStatus() != StudentStatus.TRANSFERRED)
                    .filter(i -> kw == null
                            || i.getUser().getName().toLowerCase().contains(kw)
                            || i.getCode().toLowerCase().contains(kw))
                    .map(TransferDTO.MemberSummary::from)
                    .collect(Collectors.toList());

            case "TEACHER" -> teacherInfoRepository.findBySchoolId(schoolId).stream()
                    .filter(i -> i.getStatus() != TeacherStatus.TRANSFERRED)
                    .filter(i -> kw == null
                            || i.getUser().getName().toLowerCase().contains(kw)
                            || i.getCode().toLowerCase().contains(kw))
                    .map(TransferDTO.MemberSummary::from)
                    .collect(Collectors.toList());

            case "STAFF" -> staffInfoRepository.findBySchoolId(schoolId).stream()
                    .filter(i -> i.getStatus() != StaffStatus.TRANSFERRED)
                    .filter(i -> kw == null
                            || i.getUser().getName().toLowerCase().contains(kw)
                            || i.getCode().toLowerCase().contains(kw))
                    .map(TransferDTO.MemberSummary::from)
                    .collect(Collectors.toList());

            default -> throw new IllegalArgumentException("지원하지 않는 역할입니다: " + role);
        };
    }

    /**
     * 전입 처리 실행
     *
     * @param request 전입 요청 (sourceInfoId, role, targetSchoolId)
     * @return 처리 결과
     */
    public TransferDTO.TransferResult transfer(TransferDTO.TransferRequest request) {
        School targetSchool = schoolRepository.findById(request.getTargetSchoolId())
                .orElseThrow(() -> new IllegalArgumentException("전입 학교를 찾을 수 없습니다."));

        return switch (request.getRole().toUpperCase()) {
            case "STUDENT" -> transferStudent(request.getSourceInfoId(), targetSchool);
            case "TEACHER" -> transferTeacher(request.getSourceInfoId(), targetSchool);
            case "STAFF" -> transferStaff(request.getSourceInfoId(), targetSchool);
            default -> throw new IllegalArgumentException("지원하지 않는 역할입니다: " + request.getRole());
        };
    }

    private TransferDTO.TransferResult transferStudent(Long sourceInfoId, School targetSchool) {
        StudentInfo source = studentInfoRepository.findById(sourceInfoId)
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));

        if (source.getStatus() == StudentStatus.TRANSFERRED) {
            throw new IllegalStateException("이미 전출 처리된 학생입니다.");
        }
        if (source.getSchool() != null && source.getSchool().getId().equals(targetSchool.getId())) {
            throw new IllegalStateException("전출 학교와 전입 학교가 동일합니다.");
        }

        User user = source.getUser();
        String fromSchoolName = source.getSchool() != null ? source.getSchool().getName() : "-";

        // 1. 전출 처리
        source.setStatus(StudentStatus.TRANSFERRED);
        source.setPrimary(false);

        // 2. 전입 학교에 새 StudentInfo 생성 (타깃 학교 내 코드 중복 없을 때까지 발급)
        StudentInfo newInfo = new StudentInfo();
        String newStudentCode;
        do {
            newStudentCode = codeSequenceService.issue(targetSchool.getId(), "S");
        } while (studentInfoRepository.existsByCodeAndSchoolId(newStudentCode, targetSchool.getId()));
        newInfo.setCode(newStudentCode);
        newInfo.setStatus(StudentStatus.ENROLLED);
        newInfo.setPrimary(true);
        newInfo.setUser(user);
        newInfo.setSchool(targetSchool);
        // 기존 연락처 등 기본 인적 사항 복사
        newInfo.setPhone(source.getPhone());
        newInfo.setAddress(source.getAddress());
        newInfo.setAddressDetail(source.getAddressDetail());
        newInfo.setBirthDate(source.getBirthDate());
        newInfo.setGender(source.getGender());

        user.getInfos().add(newInfo);
        StudentInfo saved = studentInfoRepository.save(newInfo);

        // 3. 전입 학교 ACTIVE RoleRequest 생성 (기존 RoleRequest가 없는 경우 또는 다른 학교)
        if (!roleRequestRepository.existsByUserAndRoleAndSchoolId(user, UserRole.STUDENT, targetSchool.getId())) {
            roleRequestRepository.save(RoleRequest.createActive(user, UserRole.STUDENT, targetSchool.getId(), null));
        }

        log.info("학생 전입 처리 완료: uid={}, {} → {}", user.getUid(), fromSchoolName, targetSchool.getName());

        TransferDTO.TransferResult result = new TransferDTO.TransferResult();
        result.setName(user.getName());
        result.setFromSchoolName(fromSchoolName);
        result.setToSchoolName(targetSchool.getName());
        result.setRole("STUDENT");
        result.setNewInfoId(saved.getId());
        return result;
    }

    private TransferDTO.TransferResult transferTeacher(Long sourceInfoId, School targetSchool) {
        TeacherInfo source = teacherInfoRepository.findById(sourceInfoId)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));

        if (source.getStatus() == TeacherStatus.TRANSFERRED) {
            throw new IllegalStateException("이미 전출 처리된 교사입니다.");
        }
        if (source.getSchool() != null && source.getSchool().getId().equals(targetSchool.getId())) {
            throw new IllegalStateException("전출 학교와 전입 학교가 동일합니다.");
        }

        User user = source.getUser();
        String fromSchoolName = source.getSchool() != null ? source.getSchool().getName() : "-";

        // 1. 전출 처리
        source.setStatus(TeacherStatus.TRANSFERRED);
        source.setPrimary(false);

        // 2. 전입 학교에 새 TeacherInfo 생성 (타깃 학교 내 코드 중복 없을 때까지 발급)
        TeacherInfo newInfo = new TeacherInfo();
        String newTeacherCode;
        do {
            newTeacherCode = codeSequenceService.issue(targetSchool.getId(), "T");
        } while (teacherInfoRepository.existsByCodeAndSchoolId(newTeacherCode, targetSchool.getId()));
        newInfo.setCode(newTeacherCode);
        newInfo.setStatus(TeacherStatus.EMPLOYED);
        newInfo.setPrimary(true);
        newInfo.setUser(user);
        newInfo.setSchool(targetSchool);
        newInfo.setDepartment(source.getDepartment());
        newInfo.setPosition(source.getPosition());
        newInfo.setPhone(source.getPhone());
        newInfo.setAddress(source.getAddress());
        newInfo.setAddressDetail(source.getAddressDetail());
        newInfo.setBirthDate(source.getBirthDate());
        newInfo.setGender(source.getGender());

        user.getInfos().add(newInfo);
        TeacherInfo saved = teacherInfoRepository.save(newInfo);

        // 3. 전입 학교 ACTIVE RoleRequest 생성
        if (!roleRequestRepository.existsByUserAndRoleAndSchoolId(user, UserRole.TEACHER, targetSchool.getId())) {
            roleRequestRepository.save(RoleRequest.createActive(user, UserRole.TEACHER, targetSchool.getId(), null));
        }

        log.info("교사 전입 처리 완료: uid={}, {} → {}", user.getUid(), fromSchoolName, targetSchool.getName());

        TransferDTO.TransferResult result = new TransferDTO.TransferResult();
        result.setName(user.getName());
        result.setFromSchoolName(fromSchoolName);
        result.setToSchoolName(targetSchool.getName());
        result.setRole("TEACHER");
        result.setNewInfoId(saved.getId());
        return result;
    }

    private TransferDTO.TransferResult transferStaff(Long sourceInfoId, School targetSchool) {
        StaffInfo source = staffInfoRepository.findById(sourceInfoId)
                .orElseThrow(() -> new IllegalArgumentException("교직원 정보를 찾을 수 없습니다."));

        if (source.getStatus() == StaffStatus.TRANSFERRED) {
            throw new IllegalStateException("이미 전출 처리된 교직원입니다.");
        }
        if (source.getSchool() != null && source.getSchool().getId().equals(targetSchool.getId())) {
            throw new IllegalStateException("전출 학교와 전입 학교가 동일합니다.");
        }

        User user = source.getUser();
        String fromSchoolName = source.getSchool() != null ? source.getSchool().getName() : "-";

        // 1. 전출 처리
        source.setStatus(StaffStatus.TRANSFERRED);
        source.setPrimary(false);

        // 2. 전입 학교에 새 StaffInfo 생성 (타깃 학교 내 코드 중복 없을 때까지 발급)
        StaffInfo newInfo = new StaffInfo();
        String newStaffCode;
        do {
            newStaffCode = codeSequenceService.issue(targetSchool.getId(), "E");
        } while (staffInfoRepository.existsByCodeAndSchoolId(newStaffCode, targetSchool.getId()));
        newInfo.setCode(newStaffCode);
        newInfo.setStatus(StaffStatus.EMPLOYED);
        newInfo.setPrimary(true);
        newInfo.setUser(user);
        newInfo.setSchool(targetSchool);
        newInfo.setDepartment(source.getDepartment());
        newInfo.setJobTitle(source.getJobTitle());
        newInfo.setWorkLocation(source.getWorkLocation());
        newInfo.setEmploymentType(source.getEmploymentType());
        newInfo.setPhone(source.getPhone());
        newInfo.setAddress(source.getAddress());
        newInfo.setAddressDetail(source.getAddressDetail());
        newInfo.setBirthDate(source.getBirthDate());
        newInfo.setGender(source.getGender());

        user.getInfos().add(newInfo);
        StaffInfo saved = staffInfoRepository.save(newInfo);

        // 3. 전입 학교 ACTIVE RoleRequest 생성
        if (!roleRequestRepository.existsByUserAndRoleAndSchoolId(user, UserRole.STAFF, targetSchool.getId())) {
            roleRequestRepository.save(RoleRequest.createActive(user, UserRole.STAFF, targetSchool.getId(), null));
        }

        log.info("교직원 전입 처리 완료: uid={}, {} → {}", user.getUid(), fromSchoolName, targetSchool.getName());

        TransferDTO.TransferResult result = new TransferDTO.TransferResult();
        result.setName(user.getName());
        result.setFromSchoolName(fromSchoolName);
        result.setToSchoolName(targetSchool.getName());
        result.setRole("STAFF");
        result.setNewInfoId(saved.getId());
        return result;
    }
}

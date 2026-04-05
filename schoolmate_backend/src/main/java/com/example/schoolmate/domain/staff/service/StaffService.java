package com.example.schoolmate.domain.staff.service;
import com.example.schoolmate.domain.school.service.CodeSequenceService;

import java.io.Reader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.domain.notification.dto.NotificationDTO;
import com.example.schoolmate.domain.staff.dto.StaffDTO;
import com.example.schoolmate.domain.staff.entity.StaffInfo;
import com.example.schoolmate.domain.staff.entity.constant.EmploymentType;
import com.example.schoolmate.domain.staff.entity.constant.StaffStatus;
import com.example.schoolmate.domain.notification.entity.Notification;
import com.example.schoolmate.domain.user.entity.RoleRequest;
import com.example.schoolmate.domain.user.entity.SchoolAdminGrant;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.GrantedRole;
import com.example.schoolmate.domain.user.entity.constant.UserRole;
import com.example.schoolmate.domain.user.repository.RoleRequestRepository;
import com.example.schoolmate.domain.user.repository.SchoolAdminGrantRepository;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.staff.repository.StaffInfoRepository;
import com.example.schoolmate.domain.notification.repository.NotificationRepository;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.global.util.NotificationHelper;
import com.example.schoolmate.domain.school.entity.School;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 관리자 교직원 관리 서비스
 * 
 * 교직원(User + StaffInfo) 데이터에 대한 CRUD 및 비즈니스 로직을 담당합니다.
 * - 행정실, 시설관리 등 교사가 아닌 직원들의 정보 관리
 * - 사번 중복 체크 및 CSV 일괄 등록 지원
 */
@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class StaffService {

    private final UserRepository userRepository;
    private final StaffInfoRepository staffInfoRepository;
    private final NotificationRepository notificationRepository;
    private final SchoolRepository schoolRepository;
    private final RoleRequestRepository roleRequestRepository;
    private final SchoolAdminGrantRepository schoolAdminGrantRepository;
    private final PasswordEncoder passwordEncoder;
    private final CodeSequenceService codeSequenceService;

    @Transactional(readOnly = true)
    public Page<StaffDTO.DetailResponse> getStaffList(StaffDTO.StaffSearchCondition cond, Pageable pageable) {
        return staffInfoRepository.search(cond, pageable).map(StaffDTO.DetailResponse::new);
    }

    @Transactional(readOnly = true)
    public StaffDTO.DetailResponse getStaffDetail(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 교직원입니다."));

        StaffDTO.DetailResponse response = new StaffDTO.DetailResponse(user);

        List<Notification> notifications = notificationRepository.findActiveByReceiver(user);
        response.setNotifications(notifications.stream().map(NotificationDTO.NotificationHistory::new).toList());

        return response;
    }

    public User createStaff(StaffDTO.CreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Set.of(UserRole.STAFF)))
                .build();

        // 학교 소속 설정 (X-School-Id 헤더 기반)
        Long schoolId = SchoolContextHolder.getSchoolId();

        StaffInfo info = new StaffInfo();
        info.setCode(codeSequenceService.issue(schoolId, "E"));
        info.setPrimary(true);
        info.setDepartment(request.getDepartment());
        info.setJobTitle(request.getJobTitle());
        info.setWorkLocation(request.getWorkLocation());
        info.setExtensionNumber(request.getExtensionNumber());
        if (request.getEmploymentType() != null) {
            info.setEmploymentType(EmploymentType.valueOf(request.getEmploymentType()));
        }
        info.setContractEndDate(request.getContractEndDate());
        info.setStatus(StaffStatus.EMPLOYED);
        info.setUser(user);

        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(info::setSchool);
        }

        user.getInfos().add(info);
        userRepository.save(user);

        // 관리자 직접 등록 시 즉시 ACTIVE RoleRequest 생성 (Hub 카드 학교명 표시 및 hasAdminAccess 연동)
        roleRequestRepository.save(RoleRequest.createActive(user, UserRole.STAFF, schoolId, null));

        // 권한 즉시 부여 (선택)
        if (request.getGrantedRole() != null && !request.getGrantedRole().isBlank() && schoolId != null) {
            try {
                GrantedRole role = GrantedRole.valueOf(request.getGrantedRole().trim());
                School school = schoolRepository.findById(schoolId).orElse(null);
                if (school != null) {
                    schoolAdminGrantRepository.save(new SchoolAdminGrant(user, school, role, null));
                }
            } catch (IllegalArgumentException e) {
                log.warn("알 수 없는 권한 코드, 권한 부여 건너뜀: {}", request.getGrantedRole());
            }
        }

        // 교직원에게 등록 완료 알림
        NotificationHelper.send(user, "교직원 등록 완료",
                user.getName() + "님의 교직원 계정이 등록되었습니다.", "/hub");

        return user;
    }

    public void updateStaff(StaffDTO.UpdateRequest request) {
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("교직원을 찾을 수 없습니다."));

        user.setName(request.getName());

        StaffInfo info = user.getInfoForSchool(StaffInfo.class, SchoolContextHolder.getSchoolId());
        if (info != null) {
            if (request.getCode() != null && !request.getCode().equals(info.getCode())) {
                Long targetSchoolId = info.getSchool() != null ? info.getSchool().getId() : null;
                boolean exists = (targetSchoolId != null)
                        ? staffInfoRepository.existsByCodeAndSchoolId(request.getCode(), targetSchoolId)
                        : staffInfoRepository.existsByCode(request.getCode());
                if (exists) {
                    throw new IllegalArgumentException("이미 존재하는 사번입니다: " + request.getCode());
                }
                info.setCode(request.getCode());
            }

            StaffStatus status = request.getStatusName() != null ? StaffStatus.valueOf(request.getStatusName())
                    : info.getStatus();
            EmploymentType empType = request.getEmploymentType() != null
                    ? EmploymentType.valueOf(request.getEmploymentType())
                    : info.getEmploymentType();

            info.update(request.getDepartment(), request.getJobTitle(), request.getWorkLocation(),
                    request.getExtensionNumber(), status, empType, request.getContractEndDate());
        }
    }

    public List<String> importStaffsFromCsv(MultipartFile file) throws Exception {
        List<String> errors = new ArrayList<>();
        List<StaffDTO.CsvImportRequest> validRows = new ArrayList<>();
        Set<String> seenEmails = new HashSet<>();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            List<StaffDTO.CsvImportRequest> beans = new CsvToBeanBuilder<StaffDTO.CsvImportRequest>(reader)
                    .withType(StaffDTO.CsvImportRequest.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();

            // 1단계: 검증 (읽기 전용 — DB 세션 오염 없음)
            for (int i = 0; i < beans.size(); i++) {
                StaffDTO.CsvImportRequest csvReq = beans.get(i);
                String rowLabel = (i + 2) + "행" + (csvReq.getName() != null ? " (" + csvReq.getName() + ")" : "");

                if (csvReq.getEmail() == null || csvReq.getEmail().isBlank()) {
                    errors.add(rowLabel + ": 이메일이 비어있습니다.");
                    continue;
                }
                if (userRepository.existsByEmail(csvReq.getEmail()) || seenEmails.contains(csvReq.getEmail())) {
                    errors.add(rowLabel + ": 이미 존재하는 이메일입니다.");
                    continue;
                }
                seenEmails.add(csvReq.getEmail());
                validRows.add(csvReq);
            }

            // 2단계: 등록 (쓰기 전용 — 검증 통과된 행만)
            for (StaffDTO.CsvImportRequest csvReq : validRows) {
                StaffDTO.CreateRequest req = new StaffDTO.CreateRequest(csvReq);
                req.setGrantedRole(csvReq.getGrantedRole());
                createStaff(req);
            }
        }
        return errors;
    }

    public void bulkUpdateStaffStatus(List<Long> uids, String statusName) {
        StaffStatus status = StaffStatus.valueOf(statusName);
        List<User> users = userRepository.findAllById(uids);
        for (User user : users) {
            StaffInfo info = user.getInfoForSchool(StaffInfo.class, SchoolContextHolder.getSchoolId());
            if (info != null) {
                info.setStatus(status);

                // 교직원에게 상태 변경 알림
                NotificationHelper.send(user, "재직 상태 변경",
                        "재직 상태가 '" + status.getDescription() + "'(으)로 변경되었습니다.");
            }
        }
    }

    public void addRole(Long uid, String roleName) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        user.getRoles().add(UserRole.valueOf(roleName));
    }

    public void removeRole(Long uid, String roleName) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        UserRole role = UserRole.valueOf(roleName);
        if (role == UserRole.STAFF) {
            throw new IllegalArgumentException("기본 권한(교직원)은 삭제할 수 없습니다.");
        }
        user.getRoles().remove(role);
    }
}

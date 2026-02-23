package com.example.schoolmate.common.service;

import java.io.Reader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.common.dto.StaffDTO;
import com.example.schoolmate.common.entity.info.StaffInfo;
import com.example.schoolmate.common.entity.info.constant.EmploymentType;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.info.staff.StaffInfoRepository;
import com.example.schoolmate.common.repository.notice.NotificationRepository;
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
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<StaffDTO.DetailResponse> getStaffList(StaffDTO.StaffSearchCondition cond, Pageable pageable) {
        return staffInfoRepository.search(cond, pageable).map(StaffDTO.DetailResponse::new);
    }

    @Transactional(readOnly = true)
    public StaffDTO.DetailResponse getStaffDetail(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 교직원입니다."));

        StaffDTO.DetailResponse response = new StaffDTO.DetailResponse(user);

        List<Notification> notifications = notificationRepository.findByReceiverOrderByCreateDateDesc(user);
        response.setNotifications(notifications.stream().map(NotificationDTO.NotificationHistory::new).toList());

        return response;
    }

    public void createStaff(StaffDTO.CreateRequest request) {
        if (request.getCode() != null && staffInfoRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 사번입니다: " + request.getCode());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Set.of(UserRole.STAFF)))
                .build();

        StaffInfo info = new StaffInfo();
        info.setCode(request.getCode());
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

        user.getInfos().add(info);
        userRepository.save(user);
    }

    public void updateStaff(StaffDTO.UpdateRequest request) {
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("교직원을 찾을 수 없습니다."));

        user.setName(request.getName());

        StaffInfo info = user.getInfo(StaffInfo.class);
        if (info != null) {
            if (request.getCode() != null && !request.getCode().equals(info.getCode())) {
                if (staffInfoRepository.existsByCode(request.getCode())) {
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

    public void importStaffsFromCsv(MultipartFile file) throws Exception {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            List<StaffDTO.CsvImportRequest> beans = new CsvToBeanBuilder<StaffDTO.CsvImportRequest>(reader)
                    .withType(StaffDTO.CsvImportRequest.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();

            for (StaffDTO.CsvImportRequest csvReq : beans) {
                try {
                    StaffDTO.CreateRequest createReq = new StaffDTO.CreateRequest(csvReq);
                    createStaff(createReq);
                } catch (Exception e) {
                    log.error("교직원 CSV 등록 실패: {}", csvReq.getEmail(), e);
                    throw e;
                }
            }
        }
    }

    public void bulkUpdateStaffStatus(List<Long> uids, String statusName) {
        StaffStatus status = StaffStatus.valueOf(statusName);
        List<User> users = userRepository.findAllById(uids);
        for (User user : users) {
            StaffInfo info = user.getInfo(StaffInfo.class);
            if (info != null)
                info.setStatus(status);
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

package com.example.schoolmate.common.service;

import com.example.schoolmate.common.entity.user.RoleRequest;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.RoleRequestStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.RoleRequestRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.util.NotificationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RoleRequestService {

    private final RoleRequestRepository roleRequestRepository;
    private final UserRepository userRepository;

    /**
     * 역할 신청 생성 (자가 신청 — PENDING 상태)
     * 중복 신청 방지: 이미 ACTIVE 또는 PENDING인 경우 예외
     * REJECTED 상태면 재신청으로 전환
     */
    public RoleRequest createRequest(User user, UserRole role, Long schoolId) {
        Optional<RoleRequest> existing = schoolId != null
                ? roleRequestRepository.findByUserAndRoleAndSchoolId(user, role, schoolId)
                : roleRequestRepository.findByUserAndRoleAndSchoolIdIsNull(user, role);
        return existing.map(req -> {
                    switch (req.getStatus()) {
                        case ACTIVE -> throw new IllegalStateException("이미 활성화된 역할입니다.");
                        case PENDING -> throw new IllegalStateException("이미 승인 대기 중인 역할입니다.");
                        case REJECTED -> {
                            req.reapply();
                            return req;
                        }
                        case SUSPENDED -> throw new IllegalStateException("정지된 역할입니다. 관리자에게 문의하세요.");
                        default -> throw new IllegalStateException("처리할 수 없는 상태입니다.");
                    }
                })
                .orElseGet(() -> roleRequestRepository.save(new RoleRequest(user, role, schoolId)));
    }

    /**
     * 역할 신청 승인 (어드민)
     * User.roles에 추가 + 승인 알림 발송
     */
    public void approve(Long requestId, User reviewer) {
        log.info("역할 신청 승인: requestId={}, reviewerUid={}", requestId, reviewer.getUid());
        RoleRequest request = findById(requestId);
        request.approve(reviewer);

        User applicant = request.getUser();
        applicant.addRole(request.getRole());
        userRepository.save(applicant);

        // 승인자와 신청자가 다를 때만 알림 발송 (자기 자신 승인 시 불필요)
        if (!reviewer.getUid().equals(applicant.getUid())) {
            String roleName = request.getRole().getDescription();
            NotificationHelper.send(reviewer, applicant,
                    "역할 신청이 승인되었습니다",
                    roleName + " 역할이 승인되어 이제 해당 기능을 이용하실 수 있습니다.");
        }
    }

    /**
     * 역할 신청 거절 (어드민)
     * User.roles에서 제거 + 거절 알림(사유 포함) 발송
     */
    public void reject(Long requestId, User reviewer, String reason) {
        log.info("역할 신청 거절: requestId={}, reviewerUid={}, reason={}", requestId, reviewer.getUid(), reason);
        RoleRequest request = findById(requestId);
        request.reject(reviewer, reason);

        User applicant = request.getUser();
        applicant.getRoles().remove(request.getRole());
        userRepository.save(applicant);

        String roleName = request.getRole().getDescription();
        NotificationHelper.send(reviewer, applicant,
                "역할 신청이 거절되었습니다",
                roleName + " 역할 신청이 거절되었습니다. 사유: " + reason);
    }

    /**
     * 역할 정지 (어드민)
     * User.roles에서 제거 + 정지 알림 발송
     */
    public void suspend(Long requestId, User reviewer) {
        log.info("역할 정지: requestId={}, reviewerUid={}", requestId, reviewer.getUid());
        RoleRequest request = findById(requestId);
        request.suspend(reviewer);

        User applicant = request.getUser();
        applicant.getRoles().remove(request.getRole());
        userRepository.save(applicant);

        String roleName = request.getRole().getDescription();
        NotificationHelper.send(reviewer, applicant,
                "역할이 정지되었습니다",
                roleName + " 역할이 정지되었습니다. 문의가 있으시면 관리자에게 연락해주세요.");
    }

    /**
     * 어드민 직접 등록 시 즉시 ACTIVE RoleRequest 생성
     */
    public RoleRequest createActiveRequest(User user, UserRole role, Long schoolId, User createdBy) {
        // 기존 신청이 있으면 상태만 ACTIVE로 업데이트
        Optional<RoleRequest> existing = schoolId != null
                ? roleRequestRepository.findByUserAndRoleAndSchoolId(user, role, schoolId)
                : roleRequestRepository.findByUserAndRoleAndSchoolIdIsNull(user, role);
        return existing.map(req -> {
                    req.approve(createdBy);
                    return req;
                })
                .orElseGet(() -> roleRequestRepository.save(
                        RoleRequest.createActive(user, role, schoolId, createdBy)));
    }

    /** 특정 유저의 모든 역할 신청 목록 */
    @Transactional(readOnly = true)
    public List<RoleRequest> getUserRequests(User user) {
        return roleRequestRepository.findByUser(user);
    }

    /** 학교별 PENDING 신청 목록 (어드민 관리용) */
    @Transactional(readOnly = true)
    public Page<RoleRequest> getPendingBySchool(Long schoolId, Pageable pageable) {
        return roleRequestRepository.findBySchoolIdAndStatus(schoolId, RoleRequestStatus.PENDING, pageable);
    }

    /** 전체 PENDING 신청 목록 (최고 어드민용) */
    @Transactional(readOnly = true)
    public Page<RoleRequest> getAllPending(Pageable pageable) {
        return roleRequestRepository.findByStatus(RoleRequestStatus.PENDING, pageable);
    }

    /** 역할별 PENDING 목록 */
    @Transactional(readOnly = true)
    public Page<RoleRequest> getPendingByRole(UserRole role, Pageable pageable) {
        return roleRequestRepository.findByRoleAndStatus(role, RoleRequestStatus.PENDING, pageable);
    }

    /** 역할별 상태별 인원 수 (PENDING/ACTIVE/REJECTED/SUSPENDED) */
    @Transactional(readOnly = true)
    public Map<String, Long> getCountsByRole(UserRole role, Long schoolId) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (RoleRequestStatus s : RoleRequestStatus.values()) {
            long count = schoolId != null
                    ? roleRequestRepository.countByRoleAndStatusAndSchoolId(role, s, schoolId)
                    : roleRequestRepository.countByRoleAndStatus(role, s);
            result.put(s.name(), count);
        }
        return result;
    }

    /** 중복 신청 여부 확인 (PENDING 또는 ACTIVE 상태가 이미 존재하는지) */
    @Transactional(readOnly = true)
    public boolean isDuplicate(User user, UserRole role) {
        return roleRequestRepository.existsByUserAndRoleAndStatusIn(
                user, role, List.of(RoleRequestStatus.PENDING, RoleRequestStatus.ACTIVE));
    }

    private RoleRequest findById(Long id) {
        return roleRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("역할 신청을 찾을 수 없습니다. ID: " + id));
    }
}

package com.example.schoolmate.common.service;

import java.io.Reader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.dto.NotificationDTO;
import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.constant.FamilyRelationship;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.entity.user.RoleRequest;
import com.example.schoolmate.common.repository.RoleRequestRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.info.FamilyRelationRepository;
import com.example.schoolmate.common.repository.info.parent.ParentInfoRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.notice.NotificationRepository;
import com.example.schoolmate.common.util.NotificationHelper;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 관리자 학부모 관리 서비스
 * 
 * 학부모(User + ParentInfo) 데이터에 대한 CRUD 및 비즈니스 로직을 담당합니다.
 * - 학부모 계정 생성 및 자녀(Student)와의 연동(FamilyRelation) 관리
 * - CSV 일괄 등록 및 상태 변경 기능 제공
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class ParentService {

    private final UserRepository userRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final ParentInfoRepository parentInfoRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRequestRepository roleRequestRepository;

    /**
     * 학부모 목록 조회 (검색 포함)
     */
    public Page<ParentDTO.Summary> getParentList(ParentDTO.ParentSearchCondition cond, Pageable pageable) {
        return parentInfoRepository.search(cond, pageable)
                .map(entity -> {
                    ParentDTO.Summary dto = new ParentDTO.Summary(entity);
                    if (entity.getUser() != null) {
                        roleRequestRepository.findByUserAndRole(entity.getUser(), UserRole.PARENT).ifPresent(rr -> {
                            dto.setRoleRequestId(rr.getId());
                            dto.setRoleRequestStatus(rr.getStatus().name());
                        });
                    }
                    return dto;
                });
    }

    /**
     * 학부모 개별 등록
     */
    @Transactional
    public void createParent(ParentDTO.CreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + request.getEmail());
        }
        if (request.getCode() != null && parentInfoRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 학부모 코드입니다: " + request.getCode());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Set.of(UserRole.PARENT)))
                .build();

        ParentInfo info = new ParentInfo();
        info.setCode(request.getCode());
        info.setParentName(request.getName());
        info.setPhone(request.getPhone());
        info.setUser(user);

        // 자녀 연동 처리
        if (request.getStudents() != null && !request.getStudents().isEmpty()) {
            for (ParentDTO.StudentRelationRequest req : request.getStudents()) {
                if (req == null || req.getStudentId() == null)
                    continue;

                User studentUser = userRepository.findById(req.getStudentId()).orElse(null);
                if (studentUser == null)
                    continue;

                StudentInfo studentInfo = studentUser.getInfo(StudentInfo.class);
                if (studentInfo != null) {
                    FamilyRelation relation = new FamilyRelation();
                    relation.setParentInfo(info);
                    relation.setStudentInfo(studentInfo);
                    relation.setRelationship(FamilyRelationship.valueOf(req.getRelationship()));
                    info.getChildrenRelations().add(relation);
                }
            }
        }

        user.getInfos().add(info);
        userRepository.save(user);

        // 관리자 직접 등록 시 즉시 ACTIVE RoleRequest 생성
        roleRequestRepository.save(RoleRequest.createActive(user, UserRole.PARENT, null, null));
    }

    /**
     * CSV 일괄 등록
     */
    @Transactional(rollbackFor = Exception.class)
    public void importParentsFromCsv(MultipartFile file) throws Exception {
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            List<ParentDTO.CsvImportRequest> beans = new CsvToBeanBuilder<ParentDTO.CsvImportRequest>(reader)
                    .withType(ParentDTO.CsvImportRequest.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();

            for (ParentDTO.CsvImportRequest csvReq : beans) {
                // 이메일 중복은 전역 고유 식별자이므로 에러로 처리
                if (csvReq.getEmail() != null && userRepository.existsByEmail(csvReq.getEmail())) {
                    throw new IllegalArgumentException("이미 존재하는 이메일입니다: " + csvReq.getEmail());
                }
                // 학부모 코드 중복은 건너뜀
                if (csvReq.getCode() != null && parentInfoRepository.existsByCode(csvReq.getCode())) {
                    log.warn("이미 존재하는 학부모 코드 건너뜀: {}", csvReq.getCode());
                    continue;
                }
                ParentDTO.CreateRequest req = new ParentDTO.CreateRequest(csvReq);
                // 자녀 연동 정보는 CSV에서 받지 않으므로 빈 리스트로 초기화
                req.setStudents(new ArrayList<>());
                createParent(req);
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("CSV 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * 학부모 상세 조회
     */
    public ParentDTO.DetailResponse getParentDetail(Long id) {
        ParentInfo parent = parentInfoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학부모 정보입니다."));

        ParentDTO.DetailResponse response = new ParentDTO.DetailResponse(parent);

        if (parent.getUser() != null) {
            List<Notification> notifications = notificationRepository
                    .findActiveByReceiver(parent.getUser());
            response.setNotifications(notifications.stream().map(NotificationDTO.NotificationHistory::new).toList());

            roleRequestRepository.findByUserAndRole(parent.getUser(), UserRole.PARENT).ifPresent(rr -> {
                response.setRoleRequestId(rr.getId());
                response.setRoleRequestStatus(rr.getStatus().name());
            });
        }
        return response;
    }

    /**
     * 학생 검색 (연동용)
     */
    public List<StudentDTO.SummaryResponse> searchStudentsForLinking(String keyword) {
        StudentDTO.StudentSearchCondition cond = new StudentDTO.StudentSearchCondition();
        cond.setKeyword(keyword);
        cond.setType("name"); // 이름으로 검색
        return studentInfoRepository.search(cond, Pageable.ofSize(20)).map(StudentDTO.SummaryResponse::new)
                .getContent();
    }

    /**
     * 학부모 정보 수정
     */
    @Transactional
    public void updateParent(ParentDTO.UpdateRequest request) {
        ParentInfo info = parentInfoRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학부모 정보입니다."));

        // 코드 변경 시 중복 체크
        if (request.getCode() != null && !request.getCode().equals(info.getCode())) {
            if (parentInfoRepository.existsByCode(request.getCode())) {
                throw new IllegalArgumentException("이미 존재하는 학부모 코드입니다: " + request.getCode());
            }
            info.setCode(request.getCode());
        }

        info.setParentName(request.getName());
        info.setPhone(request.getPhone());

        if (info.getUser() != null) {
            info.getUser().setName(request.getName());
            info.getUser().setEmail(request.getEmail());
        }
    }

    /**
     * [woo] 교사용 학부모 간편 등록
     * 이름 + 전화번호 + 관계만으로 학부모 계정 생성 + 자녀 연결
     * - 이메일: 전화번호 (예: 01012345678)
     * - 비밀번호: 전화번호 뒷 4자리 (예: 5678)
     * - 이미 같은 전화번호 계정 존재 시 자녀만 추가 연결
     */
    @Transactional
    public ParentDTO.QuickRegisterResponse quickRegisterParent(ParentDTO.QuickRegisterRequest request) {
        String phone = request.getPhoneNumber().replaceAll("[^0-9]", ""); // [woo] 숫자만 추출
        String email = phone + "@schoolmate.kr"; // [woo] 전화번호 + 도메인으로 이메일 생성
        String password = phone.substring(phone.length() - 4); // [woo] 뒷 4자리가 초기 비밀번호
        FamilyRelationship relationship = FamilyRelationship.valueOf(request.getRelationship());

        // [woo] 학생 정보 조회
        StudentInfo student = studentInfoRepository.findById(request.getStudentInfoId())
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다: " + request.getStudentInfoId()));

        // [woo] 이미 같은 전화번호(이메일)로 등록된 계정이 있는지 확인
        ParentInfo parentInfo;
        if (userRepository.existsByEmail(email)) {
            // [woo] 기존 계정 → ParentInfo 찾아서 자녀만 추가
            User existingUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            parentInfo = existingUser.getInfos().stream()
                    .filter(info -> info instanceof ParentInfo)
                    .map(info -> (ParentInfo) info)
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("해당 계정은 학부모 계정이 아닙니다."));

            // [woo] 이미 같은 학생과 연결되어 있는지 확인
            boolean alreadyLinked = parentInfo.getChildrenRelations().stream()
                    .anyMatch(r -> r.getStudentInfo().getId().equals(student.getId()));
            if (alreadyLinked) {
                throw new IllegalArgumentException("이미 해당 학생과 연결된 학부모입니다.");
            }
        } else {
            // [woo] 신규 계정 생성
            User newUser = User.builder()
                    .name(request.getParentName())
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .roles(new HashSet<>(Set.of(UserRole.PARENT)))
                    .build();

            parentInfo = new ParentInfo();
            parentInfo.setParentName(request.getParentName());
            parentInfo.setPhone(phone);
            parentInfo.setCode("P_" + phone); // [woo] 학부모 코드: P_ + 전화번호
            parentInfo.setUser(newUser);

            newUser.getInfos().add(parentInfo);
            User savedUser = userRepository.save(newUser);
            // [woo] 교사 간편 등록 시 즉시 ACTIVE — 승인 없이 바로 로그인 가능
            roleRequestRepository.save(RoleRequest.createActive(savedUser, UserRole.PARENT, null, null));
        }

        // [woo] 자녀 관계 연결
        FamilyRelation relation = new FamilyRelation();
        relation.setParentInfo(parentInfo);
        relation.setStudentInfo(student);
        relation.setRelationship(relationship);
        relation.setRepresentative(parentInfo.getChildrenRelations().isEmpty()); // [woo] 첫 자녀면 대표
        if (student.getSchool() != null) {
            relation.setSchool(student.getSchool());
        }
        parentInfo.getChildrenRelations().add(relation);
        familyRelationRepository.save(relation); // [woo] cascade 의존 대신 명시적 저장

        log.info("[woo] 학부모 간편 등록 완료 - parent: {}, student: {}, relation: {}",
                request.getParentName(), student.getUser().getName(), relationship);

        return new ParentDTO.QuickRegisterResponse(
                parentInfo.getId(),
                request.getParentName(),
                email,
                student.getUser().getName(),
                relationship.getDescription()
        );
    }

    @Transactional
    public void addChild(Long parentId, Long studentUid, FamilyRelationship relationship) {
        ParentInfo parent = parentInfoRepository.findById(parentId).orElseThrow();
        User studentUser = userRepository.findById(studentUid).orElseThrow();
        StudentInfo student = studentUser.getInfo(StudentInfo.class);

        boolean exists = parent.getChildrenRelations().stream()
                .anyMatch(r -> r.getStudentInfo().getId().equals(student.getId()));

        if (!exists) {
            FamilyRelation relation = new FamilyRelation();
            relation.setParentInfo(parent);
            relation.setStudentInfo(student);
            relation.setRelationship(relationship);
            parent.getChildrenRelations().add(relation);
        }
    }

    @Transactional
    public void updateChildRelationship(Long parentId, Long studentUid, FamilyRelationship relationship) {
        ParentInfo parent = parentInfoRepository.findById(parentId).orElseThrow();
        FamilyRelation relation = parent.getChildrenRelations().stream()
                .filter(r -> r.getStudentInfo().getUser().getUid().equals(studentUid))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("연동된 자녀가 아닙니다."));
        relation.setRelationship(relationship);
    }

    @Transactional
    public void removeChild(Long parentId, Long studentUid) {
        ParentInfo parent = parentInfoRepository.findById(parentId).orElseThrow();
        parent.getChildrenRelations().removeIf(r -> r.getStudentInfo().getUser().getUid().equals(studentUid));
    }
}
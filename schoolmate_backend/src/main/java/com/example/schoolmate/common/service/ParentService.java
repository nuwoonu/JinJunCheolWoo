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
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.info.parent.ParentInfoRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.notice.NotificationRepository;
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
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 학부모 목록 조회 (검색 포함)
     */
    public Page<ParentDTO.Summary> getParentList(ParentDTO.ParentSearchCondition cond, Pageable pageable) {
        return parentInfoRepository.search(cond, pageable)
                .map(ParentDTO.Summary::new);
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
        info.setPhoneNumber(request.getPhone());
        info.setStatus(ParentStatus.ACTIVE);
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
     * 학부모 상태 일괄 변경
     */
    @Transactional
    public void bulkUpdateParentStatus(List<Long> ids, String statusName) {
        ParentStatus status = ParentStatus.valueOf(statusName);
        List<ParentInfo> parents = parentInfoRepository.findAllById(ids);
        for (ParentInfo parent : parents) {
            parent.setStatus(status);
        }
    }

    /**
     * 학부모 상세 조회
     */
    public ParentDTO.DetailResponse getParentDetail(Long id) {
        ParentInfo parent = parentInfoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학부모 정보입니다."));

        ParentDTO.DetailResponse response = new ParentDTO.DetailResponse(parent);

        // 계정이 연결되어 있다면 알림 이력 조회
        if (parent.getUser() != null) {
            List<Notification> notifications = notificationRepository
                    .findByReceiverOrderByCreateDateDesc(parent.getUser());
            response.setNotifications(notifications.stream().map(NotificationDTO.NotificationHistory::new).toList());
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
        info.setPhoneNumber(request.getPhone());

        if (request.getStatusName() != null) {
            info.setStatus(ParentStatus.valueOf(request.getStatusName()));
        }

        if (info.getUser() != null) {
            info.getUser().setName(request.getName());
            info.getUser().setEmail(request.getEmail());
        }
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
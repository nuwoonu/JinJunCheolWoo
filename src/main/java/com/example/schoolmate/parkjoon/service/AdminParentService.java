package com.example.schoolmate.parkjoon.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
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
import com.example.schoolmate.common.repository.NotificationRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.ParentInfoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminParentService {

    private final UserRepository userRepository;
    private final ParentInfoRepository parentInfoRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 학부모 목록 조회 (검색 포함)
     */
    public Page<ParentDTO.Summary> getParentList(ParentDTO.ParentSearchCondition cond, Pageable pageable) {
        return userRepository.searchParents(cond, pageable)
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

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Set.of(UserRole.PARENT)))
                .build();

        ParentInfo info = new ParentInfo();
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
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"))) {
            String line;
            int rowNum = 1;
            br.readLine(); // 헤더 스킵

            while ((line = br.readLine()) != null) {
                rowNum++;
                String[] data = line.split(",");

                if (data.length < 4) {
                    throw new IllegalArgumentException(rowNum + "행: 필수 정보(이름, 이메일, 비밀번호, 연락처)가 누락되었습니다.");
                }

                String name = data[0].trim();
                String email = data[1].trim();
                String password = data[2].trim();
                String phone = data[3].trim();

                createParent(new ParentDTO.CreateRequest(name, email, password, phone, new ArrayList<>()));
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
            response.setNotifications(notifications.stream().map(ParentDTO.NotificationHistory::new).toList());
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
        return userRepository.searchStudents(cond, Pageable.ofSize(20)).map(StudentDTO.SummaryResponse::new)
                .getContent();
    }

    /**
     * 학부모 정보 수정
     */
    @Transactional
    public void updateParent(ParentDTO.UpdateRequest request) {
        ParentInfo info = parentInfoRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학부모 정보입니다."));

        info.setParentName(request.getName());
        info.setPhoneNumber(request.getPhone());

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
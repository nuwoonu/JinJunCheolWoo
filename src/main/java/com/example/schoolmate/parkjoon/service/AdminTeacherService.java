package com.example.schoolmate.parkjoon.service;

import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.io.InputStreamReader;
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
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.notification.Notification;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.NotificationRepository;
import com.example.schoolmate.common.repository.TeacherInfoRepository;
import com.example.schoolmate.common.repository.UserRepository;
import com.opencsv.bean.CsvToBeanBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

/**
 * 관리자 교사 관리 서비스
 * 
 * 교사(User + TeacherInfo) 데이터에 대한 CRUD 및 비즈니스 로직을 담당합니다.
 * - 교사 계정 생성 및 사번/이메일 중복 체크
 * - 담당 과목, 부서, 직책 등 교무 정보 관리
 */
@Log4j2
@Service
@RequiredArgsConstructor
@Transactional
public class AdminTeacherService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Security 설정 필요
    private final NotificationRepository notificationRepository;
    private final TeacherInfoRepository teacherInfoRepository;

    public Page<TeacherDTO.DetailResponse> getTeacherList(TeacherDTO.TeacherSearchCondition cond, Pageable pageable) {
        Page<User> userPage = userRepository.searchTeachers(cond, pageable);
        // Page 객체 내의 User 엔티티들을 DTO 생성자를 통해 DetailResponse로 변환
        return userPage.map(TeacherDTO.DetailResponse::new);
    }

    /**
     * 교사 상세 정보 조회
     */
    public TeacherDTO.DetailResponse getTeacherDetail(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 교사입니다."));

        TeacherDTO.DetailResponse response = new TeacherDTO.DetailResponse(user);

        // 알림 이력 조회
        List<Notification> notifications = notificationRepository.findByReceiverOrderByCreateDateDesc(user);
        response.setNotifications(notifications.stream().map(NotificationDTO.NotificationHistory::new).toList());

        return response;
    }

    public void createTeacher(TeacherDTO.CreateRequest request) {
        if (request.getCode() != null && teacherInfoRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 사번입니다: " + request.getCode());
        }

        // 1. 유저 기본 정보 생성
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // 암호화
                .roles(new HashSet<>(Set.of(UserRole.TEACHER)))
                .build();

        // 2. 교사 상세 정보 생성
        TeacherInfo info = new TeacherInfo();
        info.setCode(request.getCode());
        info.setSubject(request.getSubject());
        info.setDepartment(request.getDepartment());
        info.setPosition(request.getPosition());
        info.setStatus(TeacherStatus.EMPLOYED); // 초기값: 재직
        info.setUser(user);

        // 3. 연관관계 설정
        user.getInfos().add(info);

        // 4. 저장 (Cascade 옵션 덕분에 User만 저장해도 Info가 함께 저장됨)
        userRepository.save(user);
    }

    public void updateTeacher(TeacherDTO.UpdateRequest request) {
        // 1. UID로 유저 찾기
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("Invalid user Id:" + request.getUid()));

        // 2. 유저 엔티티 수정 (Dirty Checking)
        user.setName(request.getName());

        // 3. 교사 상세 정보 수정
        TeacherInfo info = user.getInfo(TeacherInfo.class);
        if (info != null && request.getStatusName() != null) {
            // 사번 변경 시 중복 체크
            if (request.getCode() != null && !request.getCode().equals(info.getCode())) {
                if (teacherInfoRepository.existsByCode(request.getCode())) {
                    throw new IllegalArgumentException("이미 존재하는 사번입니다: " + request.getCode());
                }
                info.setCode(request.getCode());
            }
            TeacherStatus newStatus = TeacherStatus.valueOf(request.getStatusName());
            info.update(request.getSubject(), request.getDepartment(), request.getPosition(), newStatus);
        }
    }

    public void importTeachersFromCsv(MultipartFile file) throws Exception {
        // UTF-8 인코딩으로 파일 읽기
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            log.info("CSV 파일 읽기 시작: {}", file.getOriginalFilename());
            // OpenCSV를 이용한 빈 변환
            List<TeacherDTO.CsvImportRequest> beans = new CsvToBeanBuilder<TeacherDTO.CsvImportRequest>(reader)
                    .withType(TeacherDTO.CsvImportRequest.class)
                    .withIgnoreLeadingWhiteSpace(true)
                    .build()
                    .parse();
            log.info("파싱된 데이터 개수: {}", beans.size());
            for (TeacherDTO.CsvImportRequest csvReq : beans) {
                try {
                    if (userRepository.existsByEmail(csvReq.getEmail())) {
                        log.warn("이미 존재하는 이메일 건너뜀: {}", csvReq.getEmail());
                        continue;
                    }
                    if (teacherInfoRepository.existsByCode(csvReq.getCode())) {
                        log.warn("이미 존재하는 사번 건너뜀: {}", csvReq.getCode());
                        continue;
                    }
                    TeacherDTO.CreateRequest createReq = new TeacherDTO.CreateRequest(csvReq);
                    this.createTeacher(createReq);
                    log.info("교사 등록 성공: {}", csvReq.getEmail());
                } catch (Exception e) {
                    // 개별 데이터 등록 실패 시 로그
                    log.error("교사 등록 중 상세 에러 ({}) : {}", csvReq.getEmail(), e.getMessage());
                    throw e; // 전체 트랜잭션을 롤백하려면 다시 던짐
                }
            }
        } catch (Exception e) {
            log.error("CSV 파싱 또는 처리 중 치명적 에러: ", e);
            throw e;
        }
    }

    /**
     * 교사 상태 일괄 변경
     */
    public void bulkUpdateTeacherStatus(List<Long> uids, String statusName) {
        TeacherStatus status = TeacherStatus.valueOf(statusName);
        List<User> users = userRepository.findAllById(uids);
        for (User user : users) {
            TeacherInfo info = user.getInfo(TeacherInfo.class);
            if (info != null)
                info.setStatus(status);
        }
    }
}

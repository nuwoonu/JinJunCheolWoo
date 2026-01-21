package com.example.schoolmate.service;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.StudentInfoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 학생 관련 조회 서비스
 * 학생 등록은 UserService.join()을 사용
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Log4j2
public class StudentService {

    private final UserRepository userRepository;
    private final StudentInfoRepository studentInfoRepository;

    /**
     * 전체 학생 목록 조회 (SummaryResponse)
     */
    public List<StudentDTO.SummaryResponse> getAllStudents() {
        log.info("전체 학생 목록 조회");
        StudentDTO.StudentSearchCondition condition = new StudentDTO.StudentSearchCondition();
        return userRepository.searchStudents(condition, Pageable.unpaged())
                .stream()
                .map(StudentDTO.SummaryResponse::new)
                .collect(Collectors.toList());
    }

    /**
     * 학생 목록 페이징 조회
     */
    public Page<StudentDTO.SummaryResponse> getStudentList(
            StudentDTO.StudentSearchCondition condition,
            Pageable pageable) {
        log.info("학생 목록 페이징 조회: {}", condition);
        return userRepository.searchStudents(condition, pageable)
                .map(StudentDTO.SummaryResponse::new);
    }

    /**
     * 학생 상세 조회 by uid
     */
    public StudentDTO.DetailResponse getStudentById(Long uid) {
        log.info("학생 상세 조회: uid={}", uid);
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다: " + uid));

        if (!user.hasRole(UserRole.STUDENT)) {
            throw new IllegalArgumentException("해당 사용자는 학생이 아닙니다: " + uid);
        }

        return new StudentDTO.DetailResponse(user);
    }

    /**
     * 학생 상세 조회 by 고유학번
     */
    public StudentDTO.DetailResponse getStudentByIdentityNum(String identityNum) {
        log.info("학생 상세 조회: identityNum={}", identityNum);
        User user = userRepository.findDetailByIdentityNum(identityNum)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다: " + identityNum));

        return new StudentDTO.DetailResponse(user);
    }

    /**
     * 학생 User 엔티티 조회 by uid (내부 사용)
     */
    public User getStudentUserById(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다: " + uid));

        if (!user.hasRole(UserRole.STUDENT)) {
            throw new IllegalArgumentException("해당 사용자는 학생이 아닙니다: " + uid);
        }

        return user;
    }
}

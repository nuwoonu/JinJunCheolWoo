package com.example.schoolmate.parkjoon.service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminStudentService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 1. 학생 목록 조회 (마스터 목록)
     */
    @Transactional(readOnly = true)
    public Page<StudentDTO.SummaryResponse> getStudentSummaryList(StudentDTO.StudentSearchCondition cond,
            Pageable pageable) {
        // QueryHandler에서 연도/학년/반 필터를 제거한 searchStudents를 호출
        return userRepository.searchStudents(cond, pageable)
                .map(StudentDTO.SummaryResponse::new); // DTO 내부에서 '가장 최근 소속'을 추출하도록 설계
    }

    /**
     * 2. 학생 상세 정보 조회
     */
    @Transactional(readOnly = true)
    public StudentDTO.DetailResponse getStudentDetail(Long uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 학생입니다. UID: " + uid));
        return new StudentDTO.DetailResponse(user);
    }

    @Transactional(readOnly = true)
    public StudentDTO.DetailResponse getStudentDetailByIdentityNum(String studentIdentityNum) {
        // 1. 학번으로 유저 조회 (학생 권한 확인 포함)
        User user = userRepository.findDetailByIdentityNum(studentIdentityNum)
                .orElseThrow(() -> new IllegalArgumentException("해당 학번의 학생을 찾을 수 없습니다: " + studentIdentityNum));

        // 2. DTO 변환 후 반환
        return new StudentDTO.DetailResponse(user);
    }

    /**
     * 3. 학생 신규 등록 (계정 생성)
     * 인적 사항 위주로 계정을 생성합니다. 학급 정보는 선택 사항입니다.
     */
    public String createStudent(StudentDTO.CreateRequest request) {
        // 1. 유저 및 권한 설정
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                .build();

        // 2. 학생 상세 정보 설정
        StudentInfo info = new StudentInfo();
        info.setStudentIdentityNum(request.getStudentIdentityNum());
        info.setStatus(StudentStatus.ENROLLED);
        info.setUser(user);
        user.getInfos().add(info);

        // 3. 학급 배정 정보(선택 사항) 처리
        if (request.getGrade() != null) {
            StudentAssignment assignment = new StudentAssignment();
            assignment.setSchoolYear(request.getYear());
            assignment.setGrade(request.getGrade());
            assignment.setClassNum(request.getClassNum());
            assignment.setStudentNum(request.getStudentNum());

            assignment.setStudentInfo(info);
            info.getAssignments().add(assignment);
        }

        // 4. 저장 및 학번 반환
        userRepository.save(user);

        // 저장된 info에서 학번을 꺼내 반환 (request에 있는 것을 써도 되지만, 저장된 상태를 보장하기 위함)
        return info.getStudentIdentityNum();
    }

    /**
     * 학생 인적사항 및 상태 수정
     */
    public void updateStudentBasicInfo(StudentDTO.UpdateRequest request) {
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));

        user.setName(request.getName());

        StudentInfo info = user.getInfo(StudentInfo.class);
        if (info != null) {
            // 학번 변경 시 중복 체크 로직이 필요할 수 있음
            info.setStudentIdentityNum(request.getStudentIdentityNum());
            if (request.getStatusName() != null) {
                info.setStatus(StudentStatus.valueOf(request.getStatusName()));
            }
            info.setBasicHabits(request.getBasicHabits());
            info.setSpecialNotes(request.getSpecialNotes());
        }
    }

    /**
     * 학적 이력 추가
     */
    public String createAssignment(StudentDTO.AssignmentRequest request) {
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        StudentInfo info = user.getInfo(StudentInfo.class);

        boolean exists = info.getAssignments().stream()
                .anyMatch(a -> a.getSchoolYear() == request.getSchoolYear());
        if (exists) {
            throw new IllegalArgumentException("이미 해당 학년도의 배정 정보가 존재합니다.");
        }

        StudentAssignment assignment = new StudentAssignment();
        assignment.setStudentInfo(info);
        assignment.setSchoolYear(request.getSchoolYear());
        assignment.setGrade(request.getGrade());
        assignment.setClassNum(request.getClassNum());
        assignment.setStudentNum(request.getStudentNum());
        info.getAssignments().add(assignment);

        return info.getStudentIdentityNum();
    }

    /**
     * 학적 이력 수정
     */
    public String updateAssignment(StudentDTO.AssignmentRequest request) {
        User user = userRepository.findById(request.getUid())
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        StudentInfo info = user.getInfo(StudentInfo.class);

        StudentAssignment assignment = info.getAssignments().stream()
                .filter(a -> a.getSchoolYear() == request.getSchoolYear())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("수정할 배정 정보를 찾을 수 없습니다."));

        assignment.setGrade(request.getGrade());
        assignment.setClassNum(request.getClassNum());
        assignment.setStudentNum(request.getStudentNum());

        return info.getStudentIdentityNum();
    }

    @Transactional(rollbackFor = Exception.class)
    public void importStudentsFromCsv(MultipartFile file) throws Exception {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"))) {
            String line;
            int rowNum = 1; // 헤더 포함 행 번호 추적
            br.readLine(); // 첫 줄 헤더 건너뛰기

            while ((line = br.readLine()) != null) {
                rowNum++;
                String[] data = line.split(",");

                // 1. 필수 데이터 검증
                if (data.length < 4) {
                    throw new IllegalArgumentException(rowNum + "행: 필수 인적사항(이름, 이메일, 비밀번호, 학번)이 누락되었습니다.");
                }

                String name = data[0].trim();
                String email = data[1].trim();
                String password = data[2].trim();
                String identityNum = data[3].trim();

                // 2. 중복 체크 (발견 시 즉시 예외 발생 -> 전체 롤백)
                if (userRepository.existsByEmail(email)) {
                    throw new IllegalArgumentException(rowNum + "행: 이미 존재하는 이메일입니다. (" + email + ")");
                }
                if (userRepository.existsStudentByIdentityNum(identityNum)) {
                    throw new IllegalArgumentException(rowNum + "행: 이미 존재하는 고유학번입니다. (" + identityNum + ")");
                }

                // 3. User 및 StudentInfo 엔티티 생성
                User user = User.builder()
                        .name(name)
                        .email(email)
                        .password(passwordEncoder.encode(password))
                        .roles(new HashSet<>(Set.of(UserRole.STUDENT)))
                        .build();

                StudentInfo info = new StudentInfo();
                info.setStudentIdentityNum(identityNum);
                info.setStatus(StudentStatus.ENROLLED);
                info.setUser(user);
                user.getInfos().add(info);

                // 4. 배정 정보(Assignment) 처리
                if (data.length >= 8 && !data[4].trim().isEmpty()) {
                    try {
                        StudentAssignment assign = new StudentAssignment();
                        assign.setSchoolYear(Integer.parseInt(data[4].trim()));
                        assign.setGrade(Integer.parseInt(data[5].trim()));
                        assign.setClassNum(Integer.parseInt(data[6].trim()));
                        assign.setStudentNum(Integer.parseInt(data[7].trim()));

                        assign.setStudentInfo(info);
                        info.getAssignments().add(assign);
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException(rowNum + "행: 학년도, 학년, 반, 번호는 숫자여야 합니다.");
                    }
                }

                // 개별 저장 (하나라도 실패하면 @Transactional에 의해 전체 취소)
                userRepository.save(user);
            }
        }
    }

    public String deleteAssignment(Long uid, int schoolYear) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new IllegalArgumentException("학생을 찾을 수 없습니다."));
        StudentInfo info = user.getInfo(StudentInfo.class);

        // 해당 학년도의 이력만 제거
        info.getAssignments().removeIf(a -> a.getSchoolYear() == schoolYear);

        return info.getStudentIdentityNum();
    }
}
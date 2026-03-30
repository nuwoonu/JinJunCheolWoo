package com.example.schoolmate.common.repository.info.student;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.user.User;

public interface StudentInfoRepository extends JpaRepository<StudentInfo, Long>, StudentInfoRepositoryCustom {

        // 특정 유저(User)의 학생 정보 찾기 — Spring Data JPA 네이밍으로 처리 가능
        Optional<StudentInfo> findByUser(User user);

        // 학교 소속 학생 전체 조회 (공지 알림용) — Spring Data JPA 네이밍으로 처리 가능
        List<StudentInfo> findBySchoolId(Long schoolId);

        // 다중 역할 인스턴스 지원 — 한 유저가 여러 학교에 학생으로 소속될 수 있음
        List<StudentInfo> findAllByUserUid(Long uid);

        // primary 인스턴스 조회 (로그인·토큰 발급 기본값)
        Optional<StudentInfo> findByUserUidAndPrimaryTrue(Long uid);


        // 학교 범위 내 학번 중복 체크
        boolean existsByCodeAndSchoolId(String code, Long schoolId);

        // [joon] @Query가 필요한 메서드는 모두 StudentInfoRepositoryCustom(QueryDSL)으로 이동됨
}

package com.example.schoolmate.domain.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.user.entity.User;

// Joon님 버전 (common/entity/user/User 경로)
public interface UserRepository extends JpaRepository<User, Long>, UserRepositoryCustom {

    // [woo 수정] LazyInitializationException 방지 - infos, roles 함께 로딩
    @EntityGraph(attributePaths = { "infos", "roles" })
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // findAllByRole → UserRepositoryCustom(QueryDSL)으로 이동됨
}

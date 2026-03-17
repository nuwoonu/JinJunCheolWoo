package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;

// Joon님 버전 (common/entity/user/User 경로)
public interface UserRepository extends JpaRepository<User, Long>, UserRepositoryCustom {

    // [woo 수정] LazyInitializationException 방지 - infos, roles 함께 로딩
    @EntityGraph(attributePaths = { "infos", "roles" })
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // OAuth2 소셜 로그인용 조회 메서드 추가 (01/29[woo])
    @EntityGraph(attributePaths = {"infos", "roles"})
    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    // 특정 역할을 가진 사용자 전체 조회
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r = :role")
    List<User> findAllByRole(@Param("role") UserRole role);
}

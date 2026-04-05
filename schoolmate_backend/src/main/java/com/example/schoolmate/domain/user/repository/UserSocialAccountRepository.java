package com.example.schoolmate.domain.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.UserSocialAccount;

public interface UserSocialAccountRepository extends JpaRepository<UserSocialAccount, Long> {

    @EntityGraph(attributePaths = {"user", "user.roles"})
    Optional<UserSocialAccount> findByProviderAndProviderId(String provider, String providerId);

    List<UserSocialAccount> findByUser(User user);

    boolean existsByUserAndProvider(User user, String provider);
}

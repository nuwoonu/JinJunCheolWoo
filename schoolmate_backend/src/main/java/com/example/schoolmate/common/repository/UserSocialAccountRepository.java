package com.example.schoolmate.common.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.UserSocialAccount;

public interface UserSocialAccountRepository extends JpaRepository<UserSocialAccount, Long> {

    Optional<UserSocialAccount> findByProviderAndProviderId(String provider, String providerId);

    List<UserSocialAccount> findByUser(User user);

    boolean existsByUserAndProvider(User user, String provider);
}

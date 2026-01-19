package com.example.schoolmate.common.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.entity.User;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUser(User user);
}

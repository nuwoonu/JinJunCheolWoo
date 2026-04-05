package com.example.schoolmate.domain.verification.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.schoolmate.domain.verification.entity.EmailSendAttempt;

public interface EmailSendAttemptRepository extends JpaRepository<EmailSendAttempt, Long> {

    @Query("SELECT COUNT(a) FROM EmailSendAttempt a WHERE a.email = :email AND a.sentAt > :since")
    long countRecentAttempts(@Param("email") String email, @Param("since") LocalDateTime since);

    @Modifying
    @Query("DELETE FROM EmailSendAttempt a WHERE a.sentAt < :before")
    void deleteOlderThan(@Param("before") LocalDateTime before);
}

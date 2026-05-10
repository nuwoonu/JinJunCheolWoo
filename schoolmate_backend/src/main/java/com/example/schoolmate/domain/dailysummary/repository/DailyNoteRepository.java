package com.example.schoolmate.domain.dailysummary.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.schoolmate.domain.dailysummary.entity.DailyNote;

public interface DailyNoteRepository extends JpaRepository<DailyNote, Long> {

    Optional<DailyNote> findByStudentIdAndNoteDate(Long studentId, LocalDate noteDate);

    List<DailyNote> findByNoteDate(LocalDate noteDate);
}

package com.example.schoolmate.domain.album.repository;

import com.example.schoolmate.domain.album.entity.ClassPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// [woo] 학급 앨범 사진 레포지토리

public interface ClassPhotoRepository extends JpaRepository<ClassPhoto, Long> {

    List<ClassPhoto> findByClassroom_CidAndIsDeletedFalseOrderByCreateDateDesc(Long classroomId);
}

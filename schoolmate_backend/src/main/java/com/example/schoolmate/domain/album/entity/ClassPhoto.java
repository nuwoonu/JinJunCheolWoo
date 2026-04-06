package com.example.schoolmate.domain.album.entity;

import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.school.entity.SchoolBaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [woo] 학급 앨범 사진 엔티티 — 담임교사만 업로드, 해당 학급 단위 갤러리

@Entity
@Table(name = "class_photo")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassPhoto extends SchoolBaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    // [woo] 저장된 파일명 (FileManager.UploadType.ALBUM)
    @Column(nullable = false)
    private String imageFilename;

    // [woo] 사진 설명 (선택)
    @Column(length = 200)
    private String caption;

    // [woo] 같은 업로드 묶음의 그룹 ID (한 번에 여러 장 올릴 때 동일 값)
    @Column(length = 50)
    private String groupId;

    @Builder.Default
    @Column(nullable = false)
    private boolean isDeleted = false;
}

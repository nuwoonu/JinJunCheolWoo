package com.example.schoolmate.common.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String uuid;        // 파일 고유 식별자
    private String path;        // 저장 경로
    private String imgName;     // 원본 파일명

    // TODO: [woo] Joon님 구조에 맞게 수정 필요
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private com.example.schoolmate.common.entity.user.User user;

    public void changeUuid(String uuid) {
        this.uuid = uuid;
    }

    public void changePath(String path) {
        this.path = path;
    }

    public void changeImgName(String imgName) {
        this.imgName = imgName;
    }
}

package com.example.schoolmate.soojin.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.User;

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
import lombok.ToString;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "writer")
@Getter
@Table(name = "notice_to_parents_tbl")
@Entity
public class NoticeToParents extends BaseEntity {

    // 학교 가정 통신문 - 교직원 작성

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long no;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String content;

    // 대상 학년 (null일땐, 전체 학년 대상)
    private Integer targetGrade;

    // 교직원
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "writer_id")
    private User writer;

    // 첨부파일
    private String attachmentUrl;

}

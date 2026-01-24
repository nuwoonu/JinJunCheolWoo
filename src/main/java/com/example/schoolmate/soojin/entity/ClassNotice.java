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
@ToString(exclude = "writerTeacher")
@Getter
@Table(name = "classnoticetbl")
@Entity
public class ClassNotice extends BaseEntity {

    // 학급 공지 - 선생님 작성

    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long no;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String content;

    // 대상 학급 - 학년 (1, 2, 3...),
    @Column(nullable = false)
    private Integer grade; //

    // 반 (1, 2, 3...)
    @Column(nullable = false)
    private Integer classNum;

    // 선생님
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "teacher_id")
    private User writerTeacher;

    // 첨부파일
    private String attachmentUrl;

}

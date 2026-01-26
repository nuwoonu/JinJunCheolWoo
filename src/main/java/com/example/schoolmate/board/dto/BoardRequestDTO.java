package com.example.schoolmate.board.dto;

import com.example.schoolmate.board.entity.BoardType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardRequestDTO {

    @NotNull(message = "게시판 타입은 필수입니다")
    private BoardType boardType;

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    private String content;

    // 학년 게시판용 (1, 2, 3)
    private Integer targetGrade;

    // 학급 게시판용 (Classroom ID)
    private Long targetClassroomId;

    // 상단 고정 여부
    private boolean isPinned;
}

package com.example.schoolmate.board.dto;

import java.time.LocalDateTime;

import com.example.schoolmate.board.entity.Board;
import com.example.schoolmate.board.entity.BoardType;

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
public class BoardResponseDTO {

    private Long id;
    private BoardType boardType;
    private String boardTypeName;
    private String title;
    private String content;

    // 작성자 정보
    private Long writerId;
    private String writerName;

    // 대상 정보
    private Integer targetGrade;
    private Long targetClassroomId;
    private String targetClassroomName;

    private int viewCount;
    private boolean isPinned;

    private LocalDateTime createDate;
    private LocalDateTime updateDate;

    // Entity -> DTO 변환
    public static BoardResponseDTO fromEntity(Board board) {
        return BoardResponseDTO.builder()
                .id(board.getId())
                .boardType(board.getBoardType())
                .boardTypeName(getBoardTypeName(board.getBoardType()))
                .title(board.getTitle())
                .content(board.getContent())
                .writerId(board.getWriter().getUid())
                .writerName(board.getWriter().getName())
                .targetGrade(board.getTargetGrade())
                .targetClassroomId(board.getTargetClassroom() != null ? board.getTargetClassroom().getCid() : null)
                .targetClassroomName(board.getTargetClassroom() != null ? board.getTargetClassroom().getClassName() : null)
                .viewCount(board.getViewCount())
                .isPinned(board.isPinned())
                .createDate(board.getCreateDate())
                .updateDate(board.getUpdateDate())
                .build();
    }

    // 목록용 (content 제외)
    public static BoardResponseDTO fromEntityForList(Board board) {
        return BoardResponseDTO.builder()
                .id(board.getId())
                .boardType(board.getBoardType())
                .boardTypeName(getBoardTypeName(board.getBoardType()))
                .title(board.getTitle())
                .writerId(board.getWriter().getUid())
                .writerName(board.getWriter().getName())
                .targetGrade(board.getTargetGrade())
                .targetClassroomId(board.getTargetClassroom() != null ? board.getTargetClassroom().getCid() : null)
                .targetClassroomName(board.getTargetClassroom() != null ? board.getTargetClassroom().getClassName() : null)
                .viewCount(board.getViewCount())
                .isPinned(board.isPinned())
                .createDate(board.getCreateDate())
                .updateDate(board.getUpdateDate())
                .build();
    }

    private static String getBoardTypeName(BoardType type) {
        return switch (type) {
            case SCHOOL_NOTICE -> "학교 공지";
            case GRADE_BOARD -> "학년 게시판";
            case CLASS_BOARD -> "학급 게시판";
            case TEACHER_BOARD -> "교직원 게시판";
            case PARENT_NOTICE -> "학부모 공지";
            case PARENT_BOARD -> "학부모 게시판";
            default -> "게시판";
        };
    }
}

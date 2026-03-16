package com.example.schoolmate.domain.board.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.example.schoolmate.domain.board.entity.Board;
import com.example.schoolmate.domain.board.entity.BoardType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Board 관련 DTO 통합 클래스
 */
public class BoardDTO {

    /** 게시물 작성/수정 요청 */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {

        @NotNull(message = "게시판 타입은 필수입니다")
        private BoardType boardType;

        @NotBlank(message = "제목은 필수입니다")
        private String title;

        @NotBlank(message = "내용은 필수입니다")
        private String content;

        private Integer targetGrade;
        private Long targetClassroomId;
        private boolean isPinned;

        @Builder.Default
        private boolean isImportant = false;

        private String attachmentUrl;
    }

    /** 게시물 응답 (목록/상세 공용) */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {

        private Long id;
        private BoardType boardType;
        private String boardTypeName;
        private String title;
        private String content;
        private Long writerId;
        private String writerName;
        private Integer targetGrade;
        private Long targetClassroomId;
        private String targetClassroomName;
        private int viewCount;
        private boolean isPinned;
        private boolean isImportant;
        private String attachmentUrl;
        private LocalDateTime createDate;
        private LocalDateTime updateDate;

        /** 상세 조회용 (content 포함) */
        public static Response fromEntity(Board board) {
            return Response.builder()
                    .id(board.getId())
                    .boardType(board.getBoardType())
                    .boardTypeName(getBoardTypeName(board.getBoardType()))
                    .title(board.getTitle())
                    .content(board.getContent())
                    .writerId(board.getWriter().getUid())
                    .writerName(board.getWriter().getName())
                    .targetGrade(board.getTargetGrade())
                    .targetClassroomId(board.getTargetClassroom() != null ? board.getTargetClassroom().getCid() : null)
                    .targetClassroomName(
                            board.getTargetClassroom() != null ? board.getTargetClassroom().getClassName() : null)
                    .viewCount(board.getViewCount())
                    .isPinned(board.isPinned())
                    .isImportant(board.isImportant())
                    .attachmentUrl(board.getAttachmentUrl())
                    .createDate(board.getCreateDate())
                    .updateDate(board.getUpdateDate())
                    .build();
        }

        /** 목록 조회용 (content 제외) */
        public static Response fromEntityForList(Board board) {
            return Response.builder()
                    .id(board.getId())
                    .boardType(board.getBoardType())
                    .boardTypeName(getBoardTypeName(board.getBoardType()))
                    .title(board.getTitle())
                    .writerId(board.getWriter().getUid())
                    .writerName(board.getWriter().getName())
                    .targetGrade(board.getTargetGrade())
                    .targetClassroomId(board.getTargetClassroom() != null ? board.getTargetClassroom().getCid() : null)
                    .targetClassroomName(
                            board.getTargetClassroom() != null ? board.getTargetClassroom().getClassName() : null)
                    .viewCount(board.getViewCount())
                    .isPinned(board.isPinned())
                    .isImportant(board.isImportant())
                    .attachmentUrl(board.getAttachmentUrl())
                    .createDate(board.getCreateDate())
                    .updateDate(board.getUpdateDate())
                    .build();
        }

        private static String getBoardTypeName(BoardType type) {
            return switch (type) {
                case SCHOOL_NOTICE -> "학교 공지";
                case CLASS_NOTICE -> "학급 공지";
                case GRADE_BOARD -> "학년 게시판";
                case CLASS_BOARD -> "학급 게시판";
                case TEACHER_BOARD -> "교직원 게시판";
                case PARENT_NOTICE -> "가정통신문";
                case PARENT_BOARD -> "학부모 게시판";
            };
        }
    }

    /** 페이지 조회 요청 */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PageRequest {

        @Builder.Default
        private int page = 1;

        @Builder.Default
        private int size = 10;

        private String type;
        private String keyword;
    }

    /** 페이지 조회 결과 */
    @Data
    public static class PageResult<E> {

        private List<E> dtoList;
        private List<Integer> pageNumList;
        private PageRequest pageRequest;
        private boolean prev, next;
        private int prevPage, nextPage, totalPage, current;
        private long totalCount;

        @Builder(builderMethodName = "withAll")
        public PageResult(List<E> dtoList, PageRequest pageRequest, long totalCount) {
            this.dtoList = dtoList;
            this.pageRequest = pageRequest;
            this.totalCount = totalCount;

            int end = (int) (Math.ceil(pageRequest.getPage() / 10.0)) * 10;
            int start = end - 9;
            int last = (int) (Math.ceil(totalCount / (double) pageRequest.getSize()));

            end = Math.min(end, last);

            this.prev = start > 1;
            this.next = totalCount > (long) end * pageRequest.getSize();

            if (prev)
                this.prevPage = start - 1;
            if (next)
                this.nextPage = end + 1;

            this.pageNumList = IntStream.rangeClosed(start, end).boxed().collect(Collectors.toList());
            this.totalPage = this.pageNumList.size();
            this.current = pageRequest.getPage();
        }
    }
}

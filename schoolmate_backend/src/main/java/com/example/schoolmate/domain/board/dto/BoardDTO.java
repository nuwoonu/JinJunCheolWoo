package com.example.schoolmate.domain.board.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import java.util.Set;

import com.example.schoolmate.common.entity.user.constant.UserRole;
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

        // [woo] 가정통신문 회신 필요 여부
        @Builder.Default
        private boolean requiresConsent = false;

        // [woo] 학부모 게시판 작성 시 선택된 자녀 uid (school + classroom 자동 연결용)
        private Long studentUserUid;

        // [soojin] 태그 (CLASS_BOARD/PARENT_BOARD/TEACHER_BOARD 분류용 - 질문/모임/유머/공지 등)
        private String tag;

        // [soojin] 다중 첨부파일 목록 (업로드 후 storedName/originalName 전달)
        private List<AttachmentRequest> attachmentFiles;
    }

    // [soojin] 첨부파일 요청 내부 클래스 (게시글 작성/수정 시 다중 파일 정보 전달)
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentRequest {
        private String originalName;
        private String storedName;
        private Long fileSize;
        private String fileType;
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
        // [woo] 읽음 수 — 교사가 확인용 (PARENT_NOTICE)
        private long readCount;
        // [woo] 가정통신문 템플릿용 학교명
        private String schoolName;
        // [woo] 가정통신문 회신 필요 여부
        private boolean requiresConsent;
        // [woo] 회신 통계 (동의수, 비동의수, 전체수)
        private long consentAgreeCount;
        private long consentDisagreeCount;
        private long consentTotalCount;

        // [soojin] 태그, 좋아요/댓글 수 (likeCount·commentCount: 목록+상세, isLiked: 상세 전용)
        private String tag;
        private long likeCount;
        private long commentCount;
        private boolean isLiked;
        // [soojin] 북마크 여부 (상세 전용), 작성자 역할 (UI 배지 표시용 - 역할 우선순위: ADMIN>TEACHER>STAFF>PARENT>STUDENT)
        private boolean isBookmarked;
        private String writerRole;
        // [soojin] 다중 첨부파일 목록 (상세 조회 시 반환)
        private List<AttachmentInfo> attachments;

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
                    // [woo] 가정통신문 템플릿용 학교명
                    .schoolName(board.getSchool() != null ? board.getSchool().getName() : null)
                    // [woo] 회신 필요 여부
                    .requiresConsent(board.isRequiresConsent())
                    // [soojin] 태그, 작성자 역할
                    .tag(board.getTag())
                    .writerRole(resolveWriterRole(board.getWriter().getRoles()))
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
                    // [woo] 회신 필요 여부
                    .requiresConsent(board.isRequiresConsent())
                    // [soojin] 태그, 작성자 역할
                    .tag(board.getTag())
                    .writerRole(resolveWriterRole(board.getWriter().getRoles()))
                    .build();
        }

        // [soojin] 작성자 역할 우선순위 결정 (ADMIN > TEACHER > STAFF > PARENT > STUDENT)
        private static String resolveWriterRole(Set<UserRole> roles) {
            if (roles == null || roles.isEmpty()) return UserRole.STUDENT.name();
            if (roles.contains(UserRole.ADMIN)) return UserRole.ADMIN.name();
            if (roles.contains(UserRole.TEACHER)) return UserRole.TEACHER.name();
            if (roles.contains(UserRole.STAFF)) return UserRole.STAFF.name();
            if (roles.contains(UserRole.PARENT)) return UserRole.PARENT.name();
            return UserRole.STUDENT.name();
        }

        // [soojin] 첨부파일 응답 내부 클래스
        @Getter
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class AttachmentInfo {
            private Long id;
            private String originalName;
            private String storedName;
            private Long fileSize;
            private String fileType;
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
                case CLASS_DIARY -> "우리반 알림장"; // [woo]
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

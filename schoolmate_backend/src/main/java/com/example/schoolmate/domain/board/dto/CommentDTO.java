package com.example.schoolmate.domain.board.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import com.example.schoolmate.domain.user.entity.constant.UserRole;
import com.example.schoolmate.domain.board.entity.Comment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// [soojin] 댓글 DTO - 최상위 댓글과 대댓글(replies) 포함
public class CommentDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private String content;
        // [soojin] null이면 최상위 댓글, 값이 있으면 대댓글
        private Long parentId;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long boardId;
        private Long parentId;
        private Long writerId;
        private String writerName;
        // [soojin] 작성자 역할 - UI 역할 배지 표시용 (ADMIN/TEACHER/STUDENT/PARENT 등)
        private String writerRole;
        private String content;
        private LocalDateTime createDate;
        private boolean isDeleted;
        // [soojin] 대댓글 목록 (최상위 댓글에만 포함)
        private List<Response> replies;

        public static Response from(Comment comment) {
            return Response.builder()
                    .id(comment.getId())
                    .boardId(comment.getBoard().getId())
                    .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                    .writerId(comment.getWriter().getUid())
                    .writerName(comment.getWriter().getName())
                    // [soojin] 작성자 역할 우선순위 결정 (ADMIN > TEACHER > STAFF > PARENT > STUDENT)
                    .writerRole(resolveRole(comment.getWriter().getRoles()))
                    .content(comment.isDeleted() ? "삭제된 댓글입니다." : comment.getContent())
                    .createDate(comment.getCreateDate())
                    .isDeleted(comment.isDeleted())
                    .build();
        }

        private static String resolveRole(Set<UserRole> roles) {
            if (roles == null || roles.isEmpty()) return UserRole.STUDENT.name();
            if (roles.contains(UserRole.ADMIN)) return UserRole.ADMIN.name();
            if (roles.contains(UserRole.TEACHER)) return UserRole.TEACHER.name();
            if (roles.contains(UserRole.STAFF)) return UserRole.STAFF.name();
            if (roles.contains(UserRole.PARENT)) return UserRole.PARENT.name();
            return UserRole.STUDENT.name();
        }
    }
}

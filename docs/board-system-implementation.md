# 게시판 시스템 구현 코드

## 디렉토리 구조

```
src/main/java/com/example/schoolmate/
├── board/
│   ├── entity/
│   │   ├── constant/
│   │   │   ├── BoardCategory.java
│   │   │   ├── BoardScope.java
│   │   │   └── PostType.java
│   │   ├── Board.java
│   │   ├── BoardPermission.java
│   │   ├── Post.java
│   │   ├── PostAttachment.java
│   │   └── Comment.java
│   └── repository/
│       ├── BoardRepository.java
│       ├── PostRepository.java
│       └── CommentRepository.java
└── common/
    └── entity/
        └── club/
            ├── constant/
            │   └── ClubMemberRole.java
            ├── Club.java
            └── ClubMember.java
```

---

## 1. Enum 클래스

### 1.1 BoardCategory.java

```java
package com.example.schoolmate.board.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BoardCategory {
    // 학교 전체 게시판 (School-wide)
    SCHOOL_NOTICE("학교공지", "학교 전체 공지사항"),
    HOME_COMMUNICATION("가정통신문", "학부모 대상 가정통신문"),
    GALLERY("갤러리", "사진/갤러리 게시판"),

    // 학급 게시판 (Class-specific)
    CLASS_NOTICE("학급공지", "학급별 공지사항/알림장"),
    CLASS_BOARD("학급게시판", "학급별 자유게시판"),

    // 학년 게시판 (Grade-specific)
    GRADE_BOARD("학년게시판", "학년별 게시판"),

    // 동아리 게시판 (Club-specific)
    CLUB_BOARD("동아리게시판", "동아리별 게시판"),

    // 역할 기반 게시판 (Role-based)
    TEACHER_BOARD("교사게시판", "교사 전용 게시판"),
    PARENT_BOARD("학부모게시판", "학부모 전용 게시판"),
    STUDENT_BOARD("학생게시판", "학생 전용 게시판");

    private final String displayName;  // 표시명
    private final String description;  // 설명
}
```

### 1.2 BoardScope.java

```java
package com.example.schoolmate.board.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BoardScope {
    SCHOOL("학교전체"),   // 학교 전체 - scopeValue: null
    GRADE("학년"),       // 특정 학년 - scopeValue: "1", "2", "3"
    CLASS("학급"),       // 특정 학급 - scopeValue: "1-3" (1학년 3반)
    CLUB("동아리"),      // 특정 동아리 - scopeValue: clubId
    ROLE("역할");        // 역할 기반 - scopeValue: "TEACHER", "PARENT" 등

    private final String displayName;
}
```

### 1.3 PostType.java

```java
package com.example.schoolmate.board.entity.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PostType {
    TEXT("일반글"),        // 일반 텍스트 게시글
    GALLERY("갤러리"),     // 이미지 중심 게시글
    NOTICE("공지"),        // 공지사항 (상단 고정)
    NEWSLETTER("통신문");  // 가정통신문

    private final String displayName;
}
```

### 1.4 ClubMemberRole.java

```java
package com.example.schoolmate.common.entity.club.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClubMemberRole {
    PRESIDENT("부장"),
    VICE_PRESIDENT("차장"),
    MEMBER("부원");

    private final String displayName;
}
```

---

## 2. Entity 클래스

### 2.1 Board.java (게시판)

```java
package com.example.schoolmate.board.entity;

import com.example.schoolmate.board.entity.constant.BoardCategory;
import com.example.schoolmate.board.entity.constant.BoardScope;
import com.example.schoolmate.common.entity.BaseEntity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@ToString(exclude = {"permissions", "posts"})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "board",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"category", "scope", "scope_value", "school_year"}
    ))
@Entity
public class Board extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_id")
    private Long boardId;

    @Column(nullable = false, length = 100)
    private String name;  // 게시판명 (예: "1학년 3반 알림장")

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BoardCategory category;  // 게시판 카테고리

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BoardScope scope;  // 게시판 범위

    @Column(name = "scope_value")
    private String scopeValue;  // 범위 값 (학년, 반, 동아리ID 등)

    @Column(name = "school_year")
    private Integer schoolYear;  // 학년도 (예: 2025)

    @Column(length = 500)
    private String description;  // 게시판 설명

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;  // 활성화 여부

    // 게시판별 권한 설정 (1:N)
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BoardPermission> permissions = new ArrayList<>();

    // 게시글 목록 (1:N)
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Post> posts = new ArrayList<>();

    // === 편의 메서드 ===
    public void changeName(String name) {
        this.name = name;
    }

    public void changeDescription(String description) {
        this.description = description;
    }

    public void deactivate() {
        this.active = false;
    }

    public void activate() {
        this.active = true;
    }

    public void addPermission(BoardPermission permission) {
        this.permissions.add(permission);
        permission.setBoard(this);
    }
}
```

### 2.2 BoardPermission.java (권한)

```java
package com.example.schoolmate.board.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.constant.UserRole;

import jakarta.persistence.*;
import lombok.*;

@ToString(exclude = {"board"})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "board_permission",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"board_id", "role"}
    ))
@Entity
public class BoardPermission extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;  // 소속 게시판

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;  // 대상 역할 (TEACHER, STUDENT, PARENT 등)

    @Builder.Default
    @Column(name = "can_read")
    private boolean canRead = true;   // 읽기 권한

    @Builder.Default
    @Column(name = "can_write")
    private boolean canWrite = false;  // 쓰기 권한

    @Builder.Default
    @Column(name = "can_comment")
    private boolean canComment = false;  // 댓글 권한

    @Builder.Default
    @Column(name = "can_delete")
    private boolean canDelete = false;  // 삭제 권한 (본인글 외)
}
```

### 2.3 Post.java (게시글)

```java
package com.example.schoolmate.board.entity;

import com.example.schoolmate.board.entity.constant.PostType;
import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.User;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@ToString(exclude = {"board", "writer", "attachments", "comments"})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "post", indexes = {
    @Index(name = "idx_post_board", columnList = "board_id"),
    @Index(name = "idx_post_writer", columnList = "writer_id"),
    @Index(name = "idx_post_pinned", columnList = "is_pinned, create_date")
})
@Entity
public class Post extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;  // 소속 게시판

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false)
    @Builder.Default
    private PostType postType = PostType.TEXT;  // 게시글 타입

    @Column(nullable = false, length = 200)
    private String title;  // 제목

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;  // 내용 (HTML or Markdown)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_id", nullable = false)
    private User writer;  // 작성자

    @Builder.Default
    @Column(name = "view_count")
    private int viewCount = 0;  // 조회수

    @Column(name = "is_pinned")
    @Builder.Default
    private boolean pinned = false;  // 상단 고정 여부

    @Column(name = "is_important")
    @Builder.Default
    private boolean important = false;  // 중요 표시 여부

    // 첨부파일 (1:N)
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostAttachment> attachments = new ArrayList<>();

    // 댓글 (1:N)
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    // === 편의 메서드 ===
    public void changeTitle(String title) {
        this.title = title;
    }

    public void changeContent(String content) {
        this.content = content;
    }

    public void increaseViewCount() {
        this.viewCount++;
    }

    public void pin() {
        this.pinned = true;
    }

    public void unpin() {
        this.pinned = false;
    }

    public void markImportant() {
        this.important = true;
    }

    public void unmarkImportant() {
        this.important = false;
    }

    public void addAttachment(PostAttachment attachment) {
        this.attachments.add(attachment);
        attachment.setPost(this);
    }
}
```

### 2.4 PostAttachment.java (첨부파일)

```java
package com.example.schoolmate.board.entity;

import com.example.schoolmate.common.entity.BaseEntity;

import jakarta.persistence.*;
import lombok.*;

@ToString(exclude = {"post"})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "post_attachment")
@Entity
public class PostAttachment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;  // 소속 게시글

    @Column(nullable = false)
    private String uuid;  // 파일 UUID (고유 식별자)

    @Column(name = "original_name", nullable = false)
    private String originalName;  // 원본 파일명

    @Column(name = "stored_path", nullable = false)
    private String storedPath;  // 저장 경로

    @Column(name = "file_size")
    private Long fileSize;  // 파일 크기 (bytes)

    @Column(name = "content_type")
    private String contentType;  // MIME 타입 (image/jpeg, application/pdf 등)

    @Builder.Default
    @Column(name = "is_image")
    private boolean isImage = false;  // 이미지 여부 (갤러리용)

    @Column(name = "display_order")
    private Integer displayOrder;  // 표시 순서 (갤러리용)

    @Column(name = "thumbnail_path")
    private String thumbnailPath;  // 썸네일 경로 (이미지인 경우)
}
```

### 2.5 Comment.java (댓글)

```java
package com.example.schoolmate.board.entity;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.User;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@ToString(exclude = {"post", "parent", "replies", "writer"})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "comment", indexes = {
    @Index(name = "idx_comment_post", columnList = "post_id")
})
@Entity
public class Comment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    private Long commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;  // 소속 게시글

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;  // 부모 댓글 (대댓글용)

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Comment> replies = new ArrayList<>();  // 대댓글 목록

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "writer_id", nullable = false)
    private User writer;  // 작성자

    @Column(nullable = false, length = 1000)
    private String content;  // 댓글 내용

    @Builder.Default
    @Column(name = "is_deleted")
    private boolean deleted = false;  // 삭제 여부 (soft delete)

    // === 편의 메서드 ===
    public void changeContent(String content) {
        this.content = content;
    }

    public void delete() {
        this.deleted = true;
        this.content = "삭제된 댓글입니다.";
    }

    public boolean isReply() {
        return this.parent != null;
    }
}
```

### 2.6 Club.java (동아리)

```java
package com.example.schoolmate.common.entity.club;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.user.User;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@ToString(exclude = {"advisor", "members"})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "club")
@Entity
public class Club extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "club_id")
    private Long clubId;

    @Column(nullable = false, length = 100)
    private String name;  // 동아리명

    @Column(length = 500)
    private String description;  // 동아리 설명

    @Column(name = "school_year")
    private Integer schoolYear;  // 활동 학년도

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "advisor_id")
    private User advisor;  // 지도교사

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;  // 활성화 여부

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ClubMember> members = new ArrayList<>();

    // === 편의 메서드 ===
    public void changeName(String name) {
        this.name = name;
    }

    public void changeDescription(String description) {
        this.description = description;
    }

    public void changeAdvisor(User advisor) {
        this.advisor = advisor;
    }

    public void deactivate() {
        this.active = false;
    }

    public void activate() {
        this.active = true;
    }
}
```

### 2.7 ClubMember.java (동아리 회원)

```java
package com.example.schoolmate.common.entity.club;

import com.example.schoolmate.common.entity.BaseEntity;
import com.example.schoolmate.common.entity.club.constant.ClubMemberRole;
import com.example.schoolmate.common.entity.user.User;

import jakarta.persistence.*;
import lombok.*;

@ToString(exclude = {"club", "user"})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "club_member",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"club_id", "user_id", "school_year"}
    ))
@Entity
public class ClubMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "school_year")
    private Integer schoolYear;  // 가입 학년도

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role")
    @Builder.Default
    private ClubMemberRole memberRole = ClubMemberRole.MEMBER;  // 회원 역할

    // === 편의 메서드 ===
    public void changeRole(ClubMemberRole role) {
        this.memberRole = role;
    }

    public boolean isLeader() {
        return this.memberRole == ClubMemberRole.PRESIDENT
            || this.memberRole == ClubMemberRole.VICE_PRESIDENT;
    }
}
```

---

## 3. Repository 인터페이스

### 3.1 BoardRepository.java

```java
package com.example.schoolmate.board.repository;

import com.example.schoolmate.board.entity.Board;
import com.example.schoolmate.board.entity.constant.BoardCategory;
import com.example.schoolmate.board.entity.constant.BoardScope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Long> {

    // 카테고리별 활성화된 게시판 목록
    List<Board> findByCategoryAndActiveTrue(BoardCategory category);

    // 특정 범위의 게시판 목록
    @Query("SELECT b FROM Board b WHERE b.scope = :scope AND b.scopeValue = :scopeValue " +
           "AND b.schoolYear = :schoolYear AND b.active = true")
    List<Board> findByScopeAndValue(
        @Param("scope") BoardScope scope,
        @Param("scopeValue") String scopeValue,
        @Param("schoolYear") Integer schoolYear
    );

    // 학교 전체 게시판
    @Query("SELECT b FROM Board b WHERE b.scope = 'SCHOOL' AND b.active = true")
    List<Board> findSchoolWideBoards();

    // 특정 학년도의 모든 활성 게시판
    List<Board> findBySchoolYearAndActiveTrue(Integer schoolYear);

    // 카테고리 + 범위 + 범위값으로 게시판 찾기
    Optional<Board> findByCategoryAndScopeAndScopeValueAndSchoolYear(
        BoardCategory category,
        BoardScope scope,
        String scopeValue,
        Integer schoolYear
    );
}
```

### 3.2 PostRepository.java

```java
package com.example.schoolmate.board.repository;

import com.example.schoolmate.board.entity.Board;
import com.example.schoolmate.board.entity.Post;
import com.example.schoolmate.board.entity.constant.PostType;
import com.example.schoolmate.common.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    // 게시판별 게시글 목록 (페이징, 고정글 우선)
    @Query("SELECT p FROM Post p WHERE p.board.boardId = :boardId " +
           "ORDER BY p.pinned DESC, p.createDate DESC")
    Page<Post> findByBoardId(@Param("boardId") Long boardId, Pageable pageable);

    // 게시판별 공지글만 조회
    @Query("SELECT p FROM Post p WHERE p.board.boardId = :boardId AND p.pinned = true " +
           "ORDER BY p.createDate DESC")
    List<Post> findPinnedPostsByBoardId(@Param("boardId") Long boardId);

    // 갤러리 게시글 조회 (이미지 포함)
    @Query("SELECT DISTINCT p FROM Post p " +
           "LEFT JOIN FETCH p.attachments a " +
           "WHERE p.board.boardId = :boardId AND p.postType = 'GALLERY' " +
           "ORDER BY p.createDate DESC")
    Page<Post> findGalleryPostsByBoardId(@Param("boardId") Long boardId, Pageable pageable);

    // 검색 기능
    @Query("SELECT p FROM Post p WHERE p.board.boardId = :boardId " +
           "AND (p.title LIKE %:keyword% OR p.content LIKE %:keyword%) " +
           "ORDER BY p.pinned DESC, p.createDate DESC")
    Page<Post> searchPosts(
        @Param("boardId") Long boardId,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    // 최근 게시글 (대시보드용)
    @Query("SELECT p FROM Post p WHERE p.board IN :boards " +
           "ORDER BY p.createDate DESC")
    List<Post> findRecentPosts(@Param("boards") List<Board> boards, Pageable pageable);

    // 특정 사용자가 작성한 게시글
    Page<Post> findByWriterOrderByCreateDateDesc(User writer, Pageable pageable);

    // 게시글 타입별 조회
    Page<Post> findByBoardAndPostTypeOrderByCreateDateDesc(
        Board board, PostType postType, Pageable pageable);
}
```

### 3.3 CommentRepository.java

```java
package com.example.schoolmate.board.repository;

import com.example.schoolmate.board.entity.Comment;
import com.example.schoolmate.common.entity.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 게시글의 최상위 댓글 (대댓글 제외)
    @Query("SELECT c FROM Comment c WHERE c.post.postId = :postId AND c.parent IS NULL " +
           "ORDER BY c.createDate ASC")
    List<Comment> findRootCommentsByPostId(@Param("postId") Long postId);

    // 게시글의 모든 댓글 수 (삭제된 것 제외)
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.post.postId = :postId AND c.deleted = false")
    int countByPostId(@Param("postId") Long postId);

    // 특정 댓글의 대댓글
    List<Comment> findByParentOrderByCreateDateAsc(Comment parent);

    // 특정 사용자가 작성한 댓글
    Page<Comment> findByWriterAndDeletedFalseOrderByCreateDateDesc(
        User writer, Pageable pageable);
}
```

### 3.4 ClubRepository.java

```java
package com.example.schoolmate.common.repository;

import com.example.schoolmate.common.entity.club.Club;
import com.example.schoolmate.common.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubRepository extends JpaRepository<Club, Long> {

    // 학년도별 활성 동아리 목록
    List<Club> findBySchoolYearAndActiveTrue(Integer schoolYear);

    // 지도교사로 검색
    List<Club> findByAdvisorAndActiveTrue(User advisor);

    // 동아리명으로 검색
    List<Club> findByNameContainingAndActiveTrue(String name);
}
```

### 3.5 ClubMemberRepository.java

```java
package com.example.schoolmate.common.repository;

import com.example.schoolmate.common.entity.club.Club;
import com.example.schoolmate.common.entity.club.ClubMember;
import com.example.schoolmate.common.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {

    // 동아리 회원 목록
    List<ClubMember> findByClubOrderByMemberRoleAsc(Club club);

    // 특정 사용자의 동아리 목록
    @Query("SELECT cm FROM ClubMember cm WHERE cm.user = :user AND cm.schoolYear = :schoolYear")
    List<ClubMember> findByUserAndSchoolYear(
        @Param("user") User user,
        @Param("schoolYear") Integer schoolYear
    );

    // 동아리 멤버 여부 확인
    @Query("SELECT COUNT(cm) > 0 FROM ClubMember cm " +
           "WHERE cm.club.clubId = :clubId AND cm.user.uid = :userId")
    boolean existsByClubIdAndUserId(
        @Param("clubId") Long clubId,
        @Param("userId") Long userId
    );

    // 특정 동아리의 특정 회원 조회
    Optional<ClubMember> findByClubAndUser(Club club, User user);

    // 동아리 회원 수
    int countByClub(Club club);
}
```

---

## 4. 테이블 관계도 (ERD)

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│      board      │       │  board_permission   │       │       post      │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ board_id (PK)   │◄──┬───│ id (PK)             │       │ post_id (PK)    │
│ name            │   │   │ board_id (FK)       │───────│ board_id (FK)   │
│ category        │   │   │ role                │       │ post_type       │
│ scope           │   │   │ can_read            │       │ title           │
│ scope_value     │   │   │ can_write           │       │ content         │
│ school_year     │   │   │ can_comment         │       │ writer_id (FK)  │──► user
│ description     │   │   │ can_delete          │       │ view_count      │
│ active          │   │   └─────────────────────┘       │ is_pinned       │
│ create_date     │   │                                 │ is_important    │
│ update_date     │   │                                 │ create_date     │
└─────────────────┘   │                                 │ update_date     │
                      │                                 └─────────────────┘
                      │                                         │
                      │         ┌───────────────────────────────┴───────────────────────────┐
                      │         │                                                           │
                      │         ▼                                                           ▼
                      │   ┌─────────────────────┐                               ┌─────────────────────┐
                      │   │  post_attachment    │                               │      comment        │
                      │   ├─────────────────────┤                               ├─────────────────────┤
                      │   │ id (PK)             │                               │ comment_id (PK)     │
                      │   │ post_id (FK)        │                               │ post_id (FK)        │
                      │   │ uuid                │                               │ parent_id (FK)      │──┐
                      │   │ original_name       │                               │ writer_id (FK)      │  │
                      │   │ stored_path         │                               │ content             │  │
                      │   │ file_size           │                               │ is_deleted          │  │
                      │   │ content_type        │                               │ create_date         │  │
                      │   │ is_image            │                               │ update_date         │  │
                      │   │ display_order       │                               └─────────────────────┘  │
                      │   │ thumbnail_path      │                                         ▲              │
                      │   └─────────────────────┘                                         └──────────────┘
                      │                                                                   (self-reference)
                      │
┌─────────────────┐   │   ┌─────────────────────┐
│      club       │   │   │    club_member      │
├─────────────────┤   │   ├─────────────────────┤
│ club_id (PK)    │◄──┼───│ id (PK)             │
│ name            │   │   │ club_id (FK)        │
│ description     │   │   │ user_id (FK)        │──► user
│ school_year     │   │   │ school_year         │
│ advisor_id (FK) │───┘   │ member_role         │
│ active          │       │ create_date         │
│ create_date     │       │ update_date         │
│ update_date     │       └─────────────────────┘
└─────────────────┘
```

---

## 5. 사용 예시

### 5.1 게시판 생성 예시

```java
// 학교 공지 게시판 (학교 전체)
Board schoolNotice = Board.builder()
    .name("학교공지사항")
    .category(BoardCategory.SCHOOL_NOTICE)
    .scope(BoardScope.SCHOOL)
    .scopeValue(null)
    .schoolYear(null)  // 학교 전체는 학년도 무관
    .description("전교생 대상 공지사항")
    .build();

// 1학년 3반 알림장
Board classNotice = Board.builder()
    .name("1학년 3반 알림장")
    .category(BoardCategory.CLASS_NOTICE)
    .scope(BoardScope.CLASS)
    .scopeValue("1-3")  // 1학년 3반
    .schoolYear(2025)
    .description("1학년 3반 학급 알림장")
    .build();

// 교사 게시판
Board teacherBoard = Board.builder()
    .name("교사게시판")
    .category(BoardCategory.TEACHER_BOARD)
    .scope(BoardScope.ROLE)
    .scopeValue("TEACHER")
    .schoolYear(null)
    .description("교사 전용 게시판")
    .build();
```

### 5.2 권한 설정 예시

```java
// 학교 공지: 교사만 쓰기, 전체 읽기
schoolNotice.addPermission(BoardPermission.builder()
    .role(UserRole.TEACHER)
    .canRead(true)
    .canWrite(true)
    .canComment(false)
    .canDelete(true)
    .build());

schoolNotice.addPermission(BoardPermission.builder()
    .role(UserRole.STUDENT)
    .canRead(true)
    .canWrite(false)
    .canComment(false)
    .canDelete(false)
    .build());

schoolNotice.addPermission(BoardPermission.builder()
    .role(UserRole.PARENT)
    .canRead(true)
    .canWrite(false)
    .canComment(false)
    .canDelete(false)
    .build());
```

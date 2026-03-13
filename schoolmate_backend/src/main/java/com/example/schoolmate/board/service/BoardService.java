package com.example.schoolmate.board.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.schoolmate.board.dto.BoardDTO;
import com.example.schoolmate.board.entity.Board;
import com.example.schoolmate.board.entity.BoardType;
import com.example.schoolmate.board.repository.BoardRepository;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.dto.CustomUserDTO;
import com.example.schoolmate.common.entity.Classroom;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;

    // ========== 게시물 조회 ==========

    /**
     * 학교 공지 목록
     */
    public Page<BoardDTO.Response> getSchoolNotices(String keyword, Pageable pageable) {
        if (keyword != null && !keyword.isBlank()) {
            return boardRepository.findByBoardTypeAndKeywordOrderByImportantDesc(BoardType.SCHOOL_NOTICE, keyword, pageable)
                    .map(BoardDTO.Response::fromEntityForList);
        }
        return boardRepository.findByBoardTypeOrderByImportantDesc(BoardType.SCHOOL_NOTICE, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학급 공지 목록
     */
    public Page<BoardDTO.Response> getClassNotices(Long classroomId, Pageable pageable) {
        return boardRepository.findByBoardTypeAndTargetClassroomId(BoardType.CLASS_NOTICE, classroomId, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학년 게시판 목록
     */
    public Page<BoardDTO.Response> getGradeBoard(int grade, Pageable pageable) {
        return boardRepository.findByBoardTypeAndTargetGrade(BoardType.GRADE_BOARD, grade, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학급 게시판 목록
     */
    public Page<BoardDTO.Response> getClassBoard(Long classroomId, Pageable pageable) {
        return boardRepository.findByBoardTypeAndTargetClassroomId(BoardType.CLASS_BOARD, classroomId, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 교직원 게시판 목록
     */
    public Page<BoardDTO.Response> getTeacherBoard(Pageable pageable) {
        return boardRepository.findTeacherBoard(BoardType.TEACHER_BOARD, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 공지 목록 (전체)
     */
    public Page<BoardDTO.Response> getParentNotices(Pageable pageable) {
        return boardRepository.findByBoardType(BoardType.PARENT_NOTICE, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 공지 목록 (학년별)
     */
    public Page<BoardDTO.Response> getParentNoticesByGrade(int grade, Pageable pageable) {
        return boardRepository.findParentBoardByGrade(BoardType.PARENT_NOTICE, grade, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 공지 목록 (학급별)
     */
    public Page<BoardDTO.Response> getParentNoticesByClassroom(Long classroomId, int grade, Pageable pageable) {
        return boardRepository.findParentBoardByClassroom(BoardType.PARENT_NOTICE, classroomId, grade, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 게시판 목록 (전체)
     */
    public Page<BoardDTO.Response> getParentBoard(Pageable pageable) {
        return boardRepository.findByBoardType(BoardType.PARENT_BOARD, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 게시판 목록 (학년별)
     */
    public Page<BoardDTO.Response> getParentBoardByGrade(int grade, Pageable pageable) {
        return boardRepository.findParentBoardByGrade(BoardType.PARENT_BOARD, grade, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 게시판 목록 (학급별)
     */
    public Page<BoardDTO.Response> getParentBoardByClassroom(Long classroomId, int grade, Pageable pageable) {
        return boardRepository.findParentBoardByClassroom(BoardType.PARENT_BOARD, classroomId, grade, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 게시물 상세 조회 (조회수 증가)
     */
    @Transactional
    public BoardDTO.Response getBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다: " + boardId));

        if (board.isDeleted()) {
            throw new IllegalArgumentException("삭제된 게시물입니다.");
        }

        board.incrementViewCount();
        return BoardDTO.Response.fromEntity(board);
    }

    /**
     * [woo] 게시물 상세 조회 - 읽기전용 (조회수 증가 없음, React GET용)
     */
    @Transactional(readOnly = true)
    public BoardDTO.Response getBoardReadOnly(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다: " + boardId));

        if (board.isDeleted()) {
            throw new IllegalArgumentException("삭제된 게시물입니다.");
        }

        return BoardDTO.Response.fromEntity(board);
    }

    /**
     * [woo] 조회수만 증가 (React POST /api/board/{id}/view 전용)
     */
    @Transactional
    public void incrementViewCount(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다: " + boardId));

        if (!board.isDeleted()) {
            board.incrementViewCount();
        }
    }

    /**
     * 최근 게시물 (대시보드용)
     */
    public List<BoardDTO.Response> getRecentBoards(BoardType type, int limit) {
        return boardRepository.findTop5ByBoardTypeAndIsDeletedFalseOrderByCreateDateDesc(type)
                .stream()
                .limit(limit)
                .map(BoardDTO.Response::fromEntityForList)
                .toList();
    }

    // ========== 게시물 작성 ==========

    /**
     * 게시물 작성
     */
    @Transactional
    public BoardDTO.Response createBoard(BoardDTO.Request request, CustomUserDTO userDTO) {
        // 작성 권한 체크
        validateWritePermission(request.getBoardType(), userDTO, request.getTargetGrade(),
                request.getTargetClassroomId());

        User writer = userRepository.findById(userDTO.getUid())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Classroom targetClassroom = null;
        if (request.getTargetClassroomId() != null) {
            targetClassroom = classroomRepository.findById(request.getTargetClassroomId())
                    .orElseThrow(() -> new IllegalArgumentException("학급을 찾을 수 없습니다."));
        }

        Board board = Board.builder()
                .boardType(request.getBoardType())
                .title(request.getTitle())
                .content(request.getContent())
                .writer(writer)
                .targetGrade(request.getTargetGrade())
                .targetClassroom(targetClassroom)
                .isPinned(request.isPinned())
                .isImportant(request.isImportant())
                .attachmentUrl(request.getAttachmentUrl())
                .build();

        Board saved = boardRepository.save(board);
        log.info("게시물 작성 완료: {} - {} by {}", saved.getBoardType(), saved.getTitle(), writer.getName());

        return BoardDTO.Response.fromEntity(saved);
    }

    // ========== 게시물 수정 ==========

    /**
     * 게시물 수정
     */
    @Transactional
    public BoardDTO.Response updateBoard(Long boardId, BoardDTO.Request request, CustomUserDTO userDTO) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 수정 권한 체크 (작성자 본인 또는 ADMIN)
        validateModifyPermission(board, userDTO);

        board.changeTitle(request.getTitle());
        board.changeContent(request.getContent());
        board.changeImportant(request.isImportant());
        board.setAttachmentUrl(request.getAttachmentUrl());

        // ADMIN만 상단 고정 변경 가능
        if (isAdmin(userDTO)) {
            if (request.isPinned() != board.isPinned()) {
                board.togglePinned();
            }
        }

        log.info("게시물 수정 완료: {} by {}", boardId, userDTO.getName());
        return BoardDTO.Response.fromEntity(board);
    }

    // ========== 게시물 삭제 ==========

    /**
     * 게시물 삭제 (soft delete)
     */
    @Transactional
    public void deleteBoard(Long boardId, CustomUserDTO userDTO) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        // 삭제 권한 체크 (작성자 본인 또는 ADMIN)
        validateModifyPermission(board, userDTO);

        board.delete();
        log.info("게시물 삭제 완료: {} by {}", boardId, userDTO.getName());
    }

    // ========== 상단 고정 ==========

    /**
     * 상단 고정 토글 (ADMIN만)
     */
    @Transactional
    public void togglePinned(Long boardId, CustomUserDTO userDTO) {
        if (!isAdmin(userDTO)) {
            throw new SecurityException("상단 고정은 관리자만 가능합니다.");
        }

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        board.togglePinned();
        log.info("상단 고정 변경: {} -> {} by {}", boardId, board.isPinned(), userDTO.getName());
    }

    // ========== 권한 체크 ==========

    /**
     * 작성 권한 검증
     */
    private void validateWritePermission(BoardType type, CustomUserDTO userDTO, Integer targetGrade,
            Long targetClassroomId) {
        // ADMIN은 모든 게시판 작성 가능
        if (isAdmin(userDTO)) {
            return;
        }

        switch (type) {
            case SCHOOL_NOTICE:
                // ADMIN만 작성 가능
                throw new SecurityException("학교 공지는 관리자만 작성할 수 있습니다.");

            case CLASS_NOTICE:
                // 교사만 작성 가능
                if (!isTeacher(userDTO)) {
                    throw new SecurityException("학급 공지는 교사만 작성할 수 있습니다.");
                }
                break;

            case GRADE_BOARD:
                // 교사만 작성 가능
                if (!isTeacher(userDTO)) {
                    throw new SecurityException("학년 게시판은 교사만 작성할 수 있습니다.");
                }
                break;

            case CLASS_BOARD:
                // 해당 반 학생만 작성 가능
                if (!isStudent(userDTO)) {
                    throw new SecurityException("학급 게시판은 학생만 작성할 수 있습니다.");
                }
                // 본인 반인지 확인
                if (!isStudentInClassroom(userDTO.getUid(), targetClassroomId)) {
                    throw new SecurityException("본인 학급의 게시판에만 작성할 수 있습니다.");
                }
                break;

            case TEACHER_BOARD:
                // 교사만 작성 가능
                if (!isTeacher(userDTO)) {
                    throw new SecurityException("교직원 게시판은 교사만 작성할 수 있습니다.");
                }
                break;

            case PARENT_NOTICE:
                // 교사만 작성 가능
                if (!isTeacher(userDTO)) {
                    throw new SecurityException("학부모 공지는 교사만 작성할 수 있습니다.");
                }
                break;

            case PARENT_BOARD:
                // 학부모만 작성 가능
                if (!isParent(userDTO)) {
                    throw new SecurityException("학부모 게시판은 학부모만 작성할 수 있습니다.");
                }
                break;

            default:
                throw new SecurityException("알 수 없는 게시판 유형입니다.");
        }
    }

    /**
     * 수정/삭제 권한 검증
     */
    private void validateModifyPermission(Board board, CustomUserDTO userDTO) {
        // ADMIN은 모든 게시물 수정/삭제 가능
        if (isAdmin(userDTO)) {
            return;
        }

        // 작성자 본인만 수정/삭제 가능
        if (!board.getWriter().getUid().equals(userDTO.getUid())) {
            throw new SecurityException("본인이 작성한 게시물만 수정/삭제할 수 있습니다.");
        }
    }

    /**
     * 열람 권한 검증
     */
    public boolean canRead(BoardType type, CustomUserDTO userDTO, Integer targetGrade, Long targetClassroomId) {
        // ADMIN은 모든 게시판 열람 가능
        if (isAdmin(userDTO)) {
            return true;
        }

        switch (type) {
            case SCHOOL_NOTICE:
                // 전체 열람 가능
                return true;

            case GRADE_BOARD:
                // 해당 학년 학생/교사만 열람
                if (isTeacher(userDTO)) {
                    return true; // 교사는 전체 열람 가능
                }
                if (isStudent(userDTO)) {
                    return userDTO.getGrade() != null && userDTO.getGrade().equals(targetGrade);
                }
                return false;

            case CLASS_NOTICE:
            case CLASS_BOARD:
                // 해당 반 학생/담임만 열람
                if (isTeacher(userDTO)) {
                    return isHomeroomTeacher(userDTO.getUid(), targetClassroomId);
                }
                if (isStudent(userDTO)) {
                    return isStudentInClassroom(userDTO.getUid(), targetClassroomId);
                }
                return false;

            case TEACHER_BOARD:
                // 교사만 열람
                return isTeacher(userDTO);

            case PARENT_NOTICE:
            case PARENT_BOARD:
                // 학부모만 열람 (추후 자녀 학년/반 체크 추가 가능)
                return isParent(userDTO) || isTeacher(userDTO);

            default:
                return false;
        }
    }

    // ========== 헬퍼 메서드 ==========

    private boolean isAdmin(CustomUserDTO userDTO) {
        return userDTO.hasRole(UserRole.ADMIN) || UserRole.ADMIN.equals(userDTO.getRole());
    }

    private boolean isTeacher(CustomUserDTO userDTO) {
        return userDTO.hasRole(UserRole.TEACHER) || UserRole.TEACHER.equals(userDTO.getRole());
    }

    private boolean isStudent(CustomUserDTO userDTO) {
        return userDTO.hasRole(UserRole.STUDENT) || UserRole.STUDENT.equals(userDTO.getRole());
    }

    private boolean isParent(CustomUserDTO userDTO) {
        return userDTO.hasRole(UserRole.PARENT) || UserRole.PARENT.equals(userDTO.getRole());
    }

    private boolean isStudentInClassroom(Long userId, Long classroomId) {
        if (classroomId == null)
            return false;
        return studentInfoRepository.findByUserUid(userId)
                .map(info -> info.getCurrentAssignment().getClassroom() != null
                        && info.getCurrentAssignment().getClassroom().getCid().equals(classroomId))
                .orElse(false);
    }

    private boolean isHomeroomTeacher(Long userId, Long classroomId) {
        if (classroomId == null)
            return false;
        return classroomRepository.findById(classroomId)
                .map(classroom -> {
                    TeacherInfo teacher = classroom.getHomeroomTeacher();
                    if (teacher == null)
                        return false;
                    return teacherInfoRepository.findByUserUid(userId)
                            .map(t -> t.getId().equals(teacher.getId()))
                            .orElse(false);
                })
                .orElse(false);
    }
}

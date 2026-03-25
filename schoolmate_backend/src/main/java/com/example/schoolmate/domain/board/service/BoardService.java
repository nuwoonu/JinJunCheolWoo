package com.example.schoolmate.domain.board.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import com.example.schoolmate.domain.board.dto.BoardDTO;
import com.example.schoolmate.domain.board.entity.Board;
import com.example.schoolmate.domain.board.entity.BoardRead;
import com.example.schoolmate.domain.board.entity.BoardType;
import com.example.schoolmate.domain.board.repository.BoardReadRepository;
import com.example.schoolmate.domain.board.repository.BoardRepository;
import com.example.schoolmate.common.entity.info.TeacherInfo;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.classroom.ClassroomRepository;
import com.example.schoolmate.common.entity.info.FamilyRelation;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.StudentAssignment;
import com.example.schoolmate.common.repository.info.FamilyRelationRepository;
import com.example.schoolmate.common.repository.info.staff.StaffInfoRepository;
import com.example.schoolmate.common.repository.info.student.StudentInfoRepository;
import com.example.schoolmate.common.repository.info.teacher.TeacherInfoRepository;
import com.example.schoolmate.common.util.NotificationHelper;
import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.school.repository.SchoolRepository;
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
    private final BoardReadRepository boardReadRepository;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StaffInfoRepository staffInfoRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final SchoolRepository schoolRepository;

    // ========== 게시물 조회 ==========

    /**
     * 학교 공지 목록
     */
    public Page<BoardDTO.Response> getSchoolNotices(String keyword, Pageable pageable) {
        return boardRepository.findByType(BoardType.SCHOOL_NOTICE, keyword, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학급 공지 목록
     */
    public Page<BoardDTO.Response> getClassNotices(Long classroomId, Pageable pageable) {
        return boardRepository.findByTypeAndClassroom(BoardType.CLASS_NOTICE, classroomId, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학년 게시판 목록
     */
    public Page<BoardDTO.Response> getGradeBoard(int grade, Pageable pageable) {
        return boardRepository.findByTypeAndGrade(BoardType.GRADE_BOARD, grade, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학급 게시판 목록
     */
    public Page<BoardDTO.Response> getClassBoard(Long classroomId, Pageable pageable) {
        return boardRepository.findByTypeAndClassroom(BoardType.CLASS_BOARD, classroomId, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 교직원 게시판 목록
     */
    public Page<BoardDTO.Response> getTeacherBoard(Pageable pageable) {
        return boardRepository.findByType(BoardType.TEACHER_BOARD, null, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 공지 목록 (전체)
     */
    public Page<BoardDTO.Response> getParentNotices(Pageable pageable) {
        return boardRepository.findByType(BoardType.PARENT_NOTICE, null, pageable)
                .map(board -> {
                    BoardDTO.Response dto = BoardDTO.Response.fromEntityForList(board);
                    // [woo] 교사 확인용 읽음 수 포함
                    dto.setReadCount(boardReadRepository.countByBoardId(board.getId()));
                    return dto;
                });
    }

    /**
     * [woo] 학부모 공지(가정통신문) - 역할별 필터링 조회
     * 학부모: 자녀 학급 + 학년 전체 + 전체 공지만 표시
     * 교사/관리자: 전체 조회
     */
    public Page<BoardDTO.Response> getParentNoticesFiltered(CustomUserDTO userDTO, Long studentUserUid, Pageable pageable) {
        // 비로그인 또는 교사/관리자 → 전체 조회
        if (userDTO == null || isAdmin(userDTO) || isTeacher(userDTO)) {
            return getParentNotices(pageable);
        }

        // [woo] 학부모 → 선택된 자녀(studentUserUid) 기준 학급+학교 필터링
        if (isParent(userDTO)) {
            StudentInfo targetStudent = null;

            // studentUserUid가 지정된 경우 해당 자녀
            if (studentUserUid != null) {
                targetStudent = studentInfoRepository.findByUserUid(studentUserUid).orElse(null);
            }

            // 없으면 첫 번째 유효한 자녀 사용
            if (targetStudent == null) {
                List<FamilyRelation> relations = familyRelationRepository.findByParentInfo_User_Uid(userDTO.getUid());
                for (FamilyRelation rel : relations) {
                    StudentInfo s = rel.getStudentInfo();
                    if (s.getCurrentAssignment() != null && s.getCurrentAssignment().getClassroom() != null) {
                        targetStudent = s;
                        break;
                    }
                }
            }

            if (targetStudent != null && targetStudent.getCurrentAssignment() != null
                    && targetStudent.getCurrentAssignment().getClassroom() != null) {
                Classroom classroom = targetStudent.getCurrentAssignment().getClassroom();
                // [woo] 자녀의 학교 ID를 SchoolContext에 세팅 → schoolFilter 적용
                if (targetStudent.getSchool() != null) {
                    SchoolContextHolder.setSchoolId(targetStudent.getSchool().getId());
                }
                return getParentNoticesByClassroom(classroom.getCid(), classroom.getGrade(), pageable);
            }
        }

        return getParentNotices(pageable);
    }

    /**
     * 학부모 공지 목록 (학년별)
     */
    public Page<BoardDTO.Response> getParentNoticesByGrade(int grade, Pageable pageable) {
        return boardRepository.findParentByGrade(BoardType.PARENT_NOTICE, grade, pageable)
                .map(board -> {
                    BoardDTO.Response dto = BoardDTO.Response.fromEntityForList(board);
                    dto.setReadCount(boardReadRepository.countByBoardId(board.getId()));
                    return dto;
                });
    }

    /**
     * 학부모 공지 목록 (학급별)
     */
    public Page<BoardDTO.Response> getParentNoticesByClassroom(Long classroomId, int grade, Pageable pageable) {
        return boardRepository.findParentByClassroom(BoardType.PARENT_NOTICE, classroomId, grade, pageable)
                .map(board -> {
                    BoardDTO.Response dto = BoardDTO.Response.fromEntityForList(board);
                    dto.setReadCount(boardReadRepository.countByBoardId(board.getId()));
                    return dto;
                });
    }

    /**
     * 학부모 게시판 목록 (전체)
     */
    public Page<BoardDTO.Response> getParentBoard(Pageable pageable) {
        return boardRepository.findByType(BoardType.PARENT_BOARD, null, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 게시판 목록 (학년별)
     */
    public Page<BoardDTO.Response> getParentBoardByGrade(int grade, Pageable pageable) {
        return boardRepository.findParentByGrade(BoardType.PARENT_BOARD, grade, pageable)
                .map(BoardDTO.Response::fromEntityForList);
    }

    /**
     * 학부모 게시판 목록 (학급별)
     */
    public Page<BoardDTO.Response> getParentBoardByClassroom(Long classroomId, int grade, Pageable pageable) {
        return boardRepository.findParentByClassroom(BoardType.PARENT_BOARD, classroomId, grade, pageable)
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
        return boardRepository.findRecentByType(type, limit)
                .stream()
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

        // [woo] 가정통신문 작성 시 교사의 담임 학급 자동 연결
        // teacher(User) 필드 기준 조회 — AdminService 담임 배정 방식과 통일
        if (request.getBoardType() == BoardType.PARENT_NOTICE && targetClassroom == null && isTeacher(userDTO)) {
            int currentYear = java.time.LocalDate.now().getYear();
            classroomRepository.findByTeacherUidAndYear(userDTO.getUid(), currentYear)
                    .ifPresent(classroom -> {
                        request.setTargetClassroomId(classroom.getCid());
                        request.setTargetGrade(classroom.getGrade());
                    });
            if (request.getTargetClassroomId() != null) {
                targetClassroom = classroomRepository.findById(request.getTargetClassroomId())
                        .orElse(null);
            }
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

        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(board::setSchool);
        }

        Board saved = boardRepository.save(board);
        log.info("게시물 작성 완료: {} - {} by {}", saved.getBoardType(), saved.getTitle(), writer.getName());

        // 학교 전체 공지 작성 시 해당 학교 소속 교사/학생 전원에게 알림 발송
        if (request.getBoardType() == BoardType.SCHOOL_NOTICE && schoolId != null) {
            notifySchoolMembers(writer, schoolId, saved.getTitle());
        }

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

    /** 학교 전체 공지 작성 시 해당 학교 소속 교사/학생 전원에게 알림 발송 (작성자 제외) */
    // ========== [woo] 읽음 처리 ==========

    /**
     * 게시물 읽음 처리 — 중복 저장 방지 (웹/앱 공통)
     */
    @Transactional
    public void markAsRead(Long boardId, Long userId) {
        if (boardReadRepository.existsByBoardIdAndUserUid(boardId, userId)) return;
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        boardReadRepository.save(BoardRead.builder().board(board).user(user).build());
    }

    /**
     * 읽은 게시물 ID 목록 조회 (프론트 일괄 표시용)
     */
    public Set<Long> getReadBoardIds(Long userId, BoardType boardType) {
        return boardReadRepository.findReadBoardIdsByUserAndType(userId, boardType);
    }

    /**
     * [woo] 게시물별 학부모 읽음/안읽음 현황 — 교사 확인용
     * 해당 공지의 대상 학급 학부모 전체 + 각 읽음 여부 반환
     */
    public List<Map<String, Object>> getParentReadStatus(Long boardId, Long teacherUid) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        Set<Long> readUids = boardReadRepository.findReadUserUidsByBoardId(boardId);

        // [woo] 대상 학급 결정: 게시물에 지정된 학급 → 교사 담임 학급 → 학교 전체 순서
        Long classroomCid = null;
        if (board.getTargetClassroom() != null) {
            classroomCid = board.getTargetClassroom().getCid();
        } else if (teacherUid != null) {
            // [woo] targetClassroom이 null이면 교사의 담임 학급으로 fallback
            int currentYear = java.time.LocalDate.now().getYear();
            classroomCid = classroomRepository.findByTeacherUidAndYear(teacherUid, currentYear)
                    .map(Classroom::getCid).orElse(null);
        }

        List<FamilyRelation> relations;
        if (classroomCid != null) {
            List<StudentInfo> students = studentInfoRepository.findByClassroomCid(classroomCid);
            Set<Long> studentIds = students.stream().map(StudentInfo::getId).collect(Collectors.toSet());
            relations = studentIds.isEmpty() ? List.of() : familyRelationRepository.findByStudentInfoIdIn(studentIds);
        } else {
            Long schoolId = SchoolContextHolder.getSchoolId();
            relations = (schoolId != null) ? familyRelationRepository.findBySchoolId(schoolId) : List.of();
        }

        return relations.stream()
                .map(rel -> {
                    User parent = rel.getParentInfo().getUser();
                    Map<String, Object> item = new HashMap<>();
                    item.put("uid", parent.getUid());
                    item.put("name", parent.getName());
                    item.put("studentName", rel.getStudentInfo().getUser().getName());
                    item.put("read", readUids.contains(parent.getUid()));
                    return item;
                })
                .sorted((a, b) -> Boolean.compare((Boolean) b.get("read"), (Boolean) a.get("read")))
                .collect(Collectors.toList());
    }

    /**
     * 안읽은 가정통신문 수 조회 (앱 뱃지/알림용)
     */
    public long countUnreadParentNotice(Long userId) {
        return boardReadRepository.countUnreadByUserAndType(userId, BoardType.PARENT_NOTICE);
    }

    private void notifySchoolMembers(User writer, Long schoolId, String noticeTitle) {
        String title = "새 학교 공지가 등록되었습니다";
        String content = "공지: " + noticeTitle;

        teacherInfoRepository.findBySchoolId(schoolId).stream()
                .map(info -> info.getUser())
                .filter(u -> u != null && !u.getUid().equals(writer.getUid()))
                .forEach(u -> NotificationHelper.send(writer, u, title, content));

        staffInfoRepository.findBySchoolId(schoolId).stream()
                .map(info -> info.getUser())
                .filter(u -> u != null && !u.getUid().equals(writer.getUid()))
                .forEach(u -> NotificationHelper.send(writer, u, title, content));

        studentInfoRepository.findBySchoolId(schoolId).stream()
                .map(info -> info.getUser())
                .filter(u -> u != null && !u.getUid().equals(writer.getUid()))
                .forEach(u -> NotificationHelper.send(writer, u, title, content));
    }
}

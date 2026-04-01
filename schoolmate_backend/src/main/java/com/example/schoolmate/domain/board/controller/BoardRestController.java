package com.example.schoolmate.domain.board.controller;

import java.io.File;
import java.net.URLConnection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.service.FileManager;
import com.example.schoolmate.domain.board.dto.BoardDTO;
import com.example.schoolmate.domain.board.entity.BoardType;
import com.example.schoolmate.domain.board.service.BoardService;
import com.example.schoolmate.dto.AuthUserDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [woo] 게시판 REST API 컨트롤러
 * - 게시물 작성, 수정, 삭제
 */
@Slf4j
@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardRestController {

    private final BoardService boardService;
    private final FileManager fileManager;

    // [woo] 첨부파일 서빙 — GET /api/board/file/{filename}
    // iframe/img에서 직접 접근 가능 (Vite 프록시가 /api 프리픽스를 프록시)
    @GetMapping("/file/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        File file = new File(System.getProperty("user.dir") + "/uploads/board/" + filename);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = URLConnection.guessContentTypeFromName(filename);
        if (contentType == null) contentType = "application/octet-stream";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(new FileSystemResource(file));
    }

    // ========== [woo] React 페이지용 GET API ==========

    // [woo 03-27] 학년 게시판 엔드포인트 제거 — 학급 게시판(/api/board/class-board)으로 대체

    /**
     * 학교 공지 목록 (React /board/school-notice)
     * GET /api/board/school-notice?keyword=&page=0&size=10
     */
    @GetMapping("/school-notice")
    public ResponseEntity<Map<String, Object>> getSchoolNotices(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<BoardDTO.Response> result = boardService.getSchoolNotices(keyword,
                PageRequest.of(page, size, Sort.by("createDate").descending()));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    /**
     * 학급 공지 목록 (React /board/class-notice/:classroomId)
     * GET /api/board/class-notice/{classroomId}?page=0&size=10
     */
    @GetMapping("/class-notice/{classroomId}")
    public ResponseEntity<Map<String, Object>> getClassNotices(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<BoardDTO.Response> result = boardService.getClassNotices(classroomId,
                PageRequest.of(page, size, Sort.by("createDate").descending()));
        Map<String, Object> response = new HashMap<>();
        response.put("content", result.getContent());
        response.put("totalPages", result.getTotalPages());
        response.put("totalElements", result.getTotalElements());
        return ResponseEntity.ok(response);
    }

    /**
     * [woo] 우리반 알림장 목록 — 학생/교사용 (학급 기준)
     * GET /api/board/class-diary/{classroomId}?page=0&size=10
     */
    @GetMapping("/class-diary/{classroomId}")
    public ResponseEntity<Map<String, Object>> getClassDiary(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<BoardDTO.Response> result = boardService.getClassDiary(classroomId,
                PageRequest.of(page, size, Sort.by("createDate").descending()));
        Map<String, Object> response = new HashMap<>();
        response.put("content", result.getContent());
        response.put("totalPages", result.getTotalPages());
        response.put("totalElements", result.getTotalElements());
        response.put("currentPage", result.getNumber());
        return ResponseEntity.ok(response);
    }

    /**
     * [woo] 우리반 알림장 목록 — 학부모용 (자녀 학급 기준)
     * GET /api/board/class-diary?studentUserUid=123&page=0&size=10
     */
    /**
     * [woo] 우리반 알림장 — 역할별 자동 학급 조회 (학생/학부모/교사 공용)
     * GET /api/board/class-diary?page=0&size=10&studentUserUid=123
     */
    @GetMapping("/class-diary")
    public ResponseEntity<Map<String, Object>> getClassDiaryAuto(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long studentUserUid,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Page<BoardDTO.Response> result = boardService.getClassDiaryAuto(
                authUser.getCustomUserDTO(), studentUserUid,
                PageRequest.of(page, size, Sort.by("createDate").descending()));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    /**
     * [woo 03-27] 학급 게시판 — 역할별 자동 학급 조회 (교사/학생 전용)
     * GET /api/board/class-board?page=0&size=10
     */
    @GetMapping("/class-board")
    public ResponseEntity<Map<String, Object>> getClassBoardAuto(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Page<BoardDTO.Response> result = boardService.getClassBoardAuto(
                authUser.getCustomUserDTO(),
                PageRequest.of(page, size, Sort.by("createDate").descending()));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    /**
     * [woo] 교직원 게시판 목록
     * GET /api/board/teacher-board?page=0&size=10
     */
    @GetMapping("/teacher-board")
    public ResponseEntity<Map<String, Object>> getTeacherBoard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<BoardDTO.Response> result = boardService.getTeacherBoard(
                PageRequest.of(page, size, Sort.by("createDate").descending()));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    /**
     * [woo] 게시물 상세 조회 - 읽기전용 (조회수 증가 없음)
     * GET /api/board/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<BoardDTO.Response> getBoard(@PathVariable Long id) {
        BoardDTO.Response board = boardService.getBoardReadOnly(id);
        return ResponseEntity.ok(board);
    }

    /**
     * [woo] 조회수 증가 - React 상세 페이지 진입 시 별도 호출
     * POST /api/board/{id}/view
     */
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> incrementView(@PathVariable Long id) {
        boardService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }

    /**
     * [woo] 학부모 공지(가정통신문) 목록 - 역할별 필터링
     * 교사: 전체 조회 / 학부모: 선택된 자녀 학급 기준 필터링
     * GET /api/board/parent-notice?page=0&size=10&studentUserUid=123&keyword=검색어
     */
    @GetMapping("/parent-notice")
    public ResponseEntity<Map<String, Object>> getParentNotices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long studentUserUid,
            // [soojin] keyword 파라미터 추가 - 가정통신문 제목 검색 지원
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        Page<BoardDTO.Response> result = boardService.getParentNoticesFiltered(
                authUser != null ? authUser.getCustomUserDTO() : null,
                studentUserUid,
                keyword,
                PageRequest.of(page, size));
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    /**
     * 학부모 게시판 목록 (React /board/parent)
     * GET /api/board/parent-board?page=0&size=10
     */
    @GetMapping("/parent-board")
    public ResponseEntity<Map<String, Object>> getParentBoard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long studentUserUid,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        // [woo] 학부모 역할인 경우 선택된 자녀 학교 기반 schoolFilter 적용
        Page<BoardDTO.Response> result = boardService.getParentBoard(PageRequest.of(page, size),
                authUser != null ? authUser.getCustomUserDTO() : null, studentUserUid);
        return ResponseEntity.ok(Map.of(
                "content", result.getContent(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", result.getNumber()));
    }

    /**
     * [woo] 게시판 파일 업로드 — POST /api/board/upload
     * 담임 학급이 있는 교사만 업로드 가능
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            // [woo] 담임 교사 권한 확인
            if (authUser == null || authUser.getCustomUserDTO().getRole() != com.example.schoolmate.common.entity.user.constant.UserRole.TEACHER) {
                return ResponseEntity.status(403).body("담임 교사만 파일을 업로드할 수 있습니다.");
            }
            int currentYear = java.time.LocalDate.now().getYear();
            boolean hasClass = boardService.hasHomeroom(authUser.getCustomUserDTO().getUid(), currentYear);
            if (!hasClass) {
                return ResponseEntity.status(403).body("담임 학급이 있는 교사만 파일을 업로드할 수 있습니다.");
            }

            // [woo] 원본 파일 저장
            String filename = fileManager.upload(file, FileManager.UploadType.BOARD);
            if (filename == null) {
                return ResponseEntity.badRequest().body("파일이 비어있습니다.");
            }

            // 리눅스 배포하고 사용할 것입니다. 가정통신문 한글파일 바로 띄우려고 생성해둔것.
            // [woo] HWP → PDF 변환 (LibreOffice 설치 필요 — Linux 배포 시 활성화)
            // 활성화 방법: sudo apt install libreoffice 후 아래 주석 해제
            /*
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            if (originalName.endsWith(".hwp") || originalName.endsWith(".hwpx")) {
                String boardDir = System.getProperty("user.dir") + "/uploads/board/";
                String hwpPath = boardDir + filename;
                try {
                    ProcessBuilder pb = new ProcessBuilder(
                        "libreoffice", "--headless", "--convert-to", "pdf",
                        "--outdir", boardDir, hwpPath
                    );
                    pb.redirectErrorStream(true);
                    Process proc = pb.start();
                    boolean done = proc.waitFor(30, java.util.concurrent.TimeUnit.SECONDS);
                    if (done && proc.exitValue() == 0) {
                        String pdfFilename = filename.replaceAll("\\.(hwp|hwpx)$", ".pdf");
                        java.io.File pdfFile = new java.io.File(boardDir + pdfFilename);
                        if (pdfFile.exists()) {
                            new java.io.File(hwpPath).delete();
                            String url = "/api/board/file/" + pdfFilename;
                            return ResponseEntity.ok(Map.of("url", url, "filename", pdfFilename));
                        }
                    }
                } catch (Exception e) {
                    log.warn("[woo] HWP 변환 실패 (LibreOffice 없음 또는 오류): {}", e.getMessage());
                }
            }
            */

            // [woo] /api/board/file/ 경로로 반환 — iframe에서 Vite 프록시 경유 가능
            String url = "/api/board/file/" + filename;
            return ResponseEntity.ok(Map.of("url", url, "filename", filename));
        } catch (Exception e) {
            log.error("파일 업로드 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body("파일 업로드에 실패했습니다.");
        }
    }

    /**
     * 게시물 작성
     */
    @PostMapping
    public ResponseEntity<?> createBoard(
            @Valid @RequestBody BoardDTO.Request request,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        try {
            BoardDTO.Response response = boardService.createBoard(request, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            log.warn("게시물 작성 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("게시물 작성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 게시물 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBoard(
            @PathVariable Long id,
            @Valid @RequestBody BoardDTO.Request request,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        try {
            BoardDTO.Response response = boardService.updateBoard(id, request, authUser.getCustomUserDTO());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            log.warn("게시물 수정 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("게시물 수정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 게시물 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBoard(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        try {
            boardService.deleteBoard(id, authUser.getCustomUserDTO());
            return ResponseEntity.ok().body("삭제되었습니다.");
        } catch (SecurityException e) {
            log.warn("게시물 삭제 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("게시물 삭제 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ========== [woo] 읽음 처리 API ==========

    /**
     * [woo] 게시물 읽음 처리 — POST /api/board/{id}/read
     * 웹·앱 공통 호출, 중복 저장 방지
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        boardService.markAsRead(id, authUser.getCustomUserDTO().getUid());
        return ResponseEntity.ok().build();
    }

    /**
     * [woo] 읽은 게시물 ID 목록 — GET /api/board/read-ids?type=PARENT_NOTICE
     * 프론트에서 목록 렌더 시 읽음 표시 일괄 처리용
     */
    @GetMapping("/read-ids")
    public ResponseEntity<Set<Long>> getReadIds(
            @RequestParam String type,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        BoardType boardType = BoardType.valueOf(type);
        Set<Long> ids = boardService.getReadBoardIds(authUser.getCustomUserDTO().getUid(), boardType);
        return ResponseEntity.ok(ids);
    }

    /**
     * [woo] 학부모 읽음/안읽음 현황 — GET /api/board/{id}/read-status
     * 교사가 누가 읽었는지 확인하는 API
     */
    @GetMapping("/{id}/read-status")
    public ResponseEntity<?> getParentReadStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        return ResponseEntity.ok(boardService.getParentReadStatus(id, authUser.getCustomUserDTO().getUid()));
    }

    /**
     * [woo] 안읽은 가정통신문 수 — GET /api/board/unread-count
     * 앱 푸시 뱃지, 사이드바 알림 뱃지용
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        long count = boardService.countUnreadParentNotice(authUser.getCustomUserDTO().getUid());
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ========== [woo] 회신(동의) API ==========

    /**
     * [woo] 가정통신문 회신 제출 — POST /api/board/{id}/consent
     * body: { "agreed": true/false, "memo": "..." }
     */
    @PostMapping("/{id}/consent")
    public ResponseEntity<?> submitConsent(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            boolean agreed = Boolean.TRUE.equals(body.get("agreed"));
            String memo = body.get("memo") != null ? body.get("memo").toString() : null;
            return ResponseEntity.ok(
                    boardService.submitConsent(id, authUser.getCustomUserDTO().getUid(), agreed, memo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * [woo] 본인 회신 상태 조회 — GET /api/board/{id}/my-consent
     */
    @GetMapping("/{id}/my-consent")
    public ResponseEntity<?> getMyConsent(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        return ResponseEntity.ok(
                boardService.getMyConsent(id, authUser.getCustomUserDTO().getUid()));
    }

    /**
     * [woo] 교사용 회신 현황 — GET /api/board/{id}/consent-status
     */
    @GetMapping("/{id}/consent-status")
    public ResponseEntity<?> getConsentStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        return ResponseEntity.ok(
                boardService.getConsentStatus(id, authUser.getCustomUserDTO().getUid()));
    }

    /**
     * 상단 고정 토글 (ADMIN만)
     */
    @PostMapping("/{id}/pin")
    public ResponseEntity<?> togglePinned(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        try {
            boardService.togglePinned(id, authUser.getCustomUserDTO());
            return ResponseEntity.ok().body("상단 고정이 변경되었습니다.");
        } catch (SecurityException e) {
            log.warn("상단 고정 권한 없음: {}", e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("상단 고정 변경 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

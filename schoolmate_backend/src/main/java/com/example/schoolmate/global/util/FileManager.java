package com.example.schoolmate.global.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 파일 업로드 통합 관리자.
 *
 * <p>업로드 타입별로 파일명 생성 규칙과 저장 경로를 관리하며,
 * 기존 파일 교체(replace) 시 삭제·업로드를 원자적으로 처리합니다.</p>
 *
 * <ul>
 *   <li>PROFILE  : UUID 만 사용 (사용자당 1개, DB 로 관리)</li>
 *   <li>HOMEWORK : YYYYMMDD_UUID (날짜 추적)</li>
 *   <li>ASSET    : YYYYMMDD_UUID</li>
 *   <li>FACILITY : YYYYMMDD_UUID</li>
 * </ul>
 *
 * <p>모든 파일은 {@code {user.dir}/uploads/{type.dir}/} 아래에 저장되며,
 * 웹 URL 은 {@link UploadType#toUrl(String)} 을 통해 일관되게 생성합니다.</p>
 */
@Slf4j
@Component
public class FileManager {

    /** 타입별 업로드 설정 */
    public enum UploadType {
        /** 프로필 이미지 — UUID 만 사용, 사용자당 1개 */
        PROFILE("profile"),
        /** 과제·제출 첨부파일 */
        HOMEWORK("homework"),
        /** 기자재 모델 이미지 */
        ASSET("assets"),
        /** 시설 이미지 */
        FACILITY("facilities"),
        /** [woo] 게시판 첨부파일 (가정통신문 등) */
        BOARD("board"),
        /** [woo] 학급 앨범 사진 */
        ALBUM("album");

        final String dir;

        UploadType(String dir) { this.dir = dir; }

        /** 저장된 파일명 → 웹 접근 URL */
        public String toUrl(String filename) {
            return "/upload/" + dir + "/" + filename;
        }
    }

    private final String uploadRoot = System.getProperty("user.dir") + "/uploads/";

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * 새 파일을 업로드합니다.
     *
     * @param file 업로드할 파일 (null·empty 이면 null 반환)
     * @param type 업로드 타입
     * @return 저장된 파일명 (DB 에 보관할 값); 파일이 없으면 null
     */
    @Nullable
    public String upload(@Nullable MultipartFile file, UploadType type) {
        if (file == null || file.isEmpty()) return null;
        String filename = generateFilename(file, type);
        persist(file, type, filename);
        log.debug("[FileManager] 업로드: {}/{}", type.dir, filename);
        return filename;
    }

    /**
     * 기존 파일을 새 파일로 교체합니다.
     * oldFilename 이 null 이면 기존 파일 삭제 없이 신규 업로드만 수행합니다.
     *
     * @param file        새 파일
     * @param oldFilename 교체 대상 파일명 (null 허용)
     * @param type        업로드 타입
     * @return 저장된 새 파일명; 파일이 없으면 null
     */
    @Nullable
    public String replace(@Nullable MultipartFile file, @Nullable String oldFilename, UploadType type) {
        delete(oldFilename, type);
        return upload(file, type);
    }

    /**
     * 파일을 삭제합니다. filename 이 null 또는 blank 이면 무시합니다.
     */
    public void delete(@Nullable String filename, UploadType type) {
        if (filename == null || filename.isBlank()) return;
        File target = new File(uploadRoot + type.dir + "/" + filename);
        if (target.exists() && target.delete()) {
            log.debug("[FileManager] 삭제: {}/{}", type.dir, filename);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String generateFilename(MultipartFile file, UploadType type) {
        String ext = extractExtension(file.getOriginalFilename());
        return switch (type) {
            // 프로필: UUID 만 (사용자당 하나, DB 로 추적)
            case PROFILE -> UUID.randomUUID() + ext;
            // 나머지: 날짜_UUID (시간대별 파악 용이)
            default -> LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
                    + "_" + UUID.randomUUID() + ext;
        };
    }

    private String extractExtension(@Nullable String originalFilename) {
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename
                    .substring(originalFilename.lastIndexOf("."))
                    .toLowerCase();
        }
        return "";
    }

    private void persist(MultipartFile file, UploadType type, String filename) {
        try {
            File dir = new File(uploadRoot + type.dir);
            if (!dir.exists()) dir.mkdirs();
            file.transferTo(new File(dir, filename));
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패: " + filename, e);
        }
    }
}

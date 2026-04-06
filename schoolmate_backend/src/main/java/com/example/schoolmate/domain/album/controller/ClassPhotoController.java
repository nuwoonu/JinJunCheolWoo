package com.example.schoolmate.domain.album.controller;

import com.example.schoolmate.domain.user.entity.constant.UserRole;
import com.example.schoolmate.domain.album.service.ClassPhotoService;
import com.example.schoolmate.domain.user.dto.AuthUserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

// [woo] 학급 앨범 REST API
// GET  /api/class/photos/{classroomId} — 해당 학급 사진 목록 (교사/학생/학부모)
// GET  /api/class/photos/my            — 담임 본인 학급 사진 목록 (교사)
// POST /api/class/photos               — 사진 업로드 (교사 전용)
// DELETE /api/class/photos/{id}        — 사진 삭제 (업로드한 교사 또는 관리자)

@Slf4j
@RestController
@RequestMapping("/api/class/photos")
@RequiredArgsConstructor
public class ClassPhotoController {

    private final ClassPhotoService classPhotoService;

    @GetMapping("/{classroomId}")
    public ResponseEntity<?> getByClassroom(
            @PathVariable Long classroomId) {
        return ResponseEntity.ok(classPhotoService.getPhotosByClassroom(classroomId));
    }

    // [woo] 학생 기반 학급 사진 조회 (학부모/학생용)
    @GetMapping("/by-student/{studentInfoId}")
    public ResponseEntity<?> getByStudent(
            @PathVariable Long studentInfoId) {
        try {
            return ResponseEntity.ok(classPhotoService.getPhotosByStudent(studentInfoId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyClassPhotos(
            @AuthenticationPrincipal AuthUserDTO authUser) {
        Long uid = authUser.getCustomUserDTO().getUid();
        return ResponseEntity.ok(classPhotoService.getMyClassPhotos(uid));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false, defaultValue = "") String caption,
            @RequestParam(value = "groupId", required = false) String groupId,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            Map<String, Object> result = classPhotoService.uploadPhoto(uid, file, caption, groupId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("[woo] 사진 업로드 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // [woo] 사진 캡션 수정
    @PatchMapping("/{id}/caption")
    public ResponseEntity<?> updateCaption(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            UserRole role = authUser.getCustomUserDTO().getRole();
            boolean isAdmin = UserRole.ADMIN == role;
            String caption = body.getOrDefault("caption", "");
            classPhotoService.updateCaption(id, caption, uid, isAdmin);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("[woo] 캡션 수정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthUserDTO authUser) {
        try {
            Long uid = authUser.getCustomUserDTO().getUid();
            UserRole role = authUser.getCustomUserDTO().getRole();
            boolean isAdmin = UserRole.ADMIN == role;
            classPhotoService.deletePhoto(id, uid, isAdmin);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("[woo] 사진 삭제 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

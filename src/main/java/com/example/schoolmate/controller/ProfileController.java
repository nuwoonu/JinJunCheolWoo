package com.example.schoolmate.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.example.schoolmate.common.entity.Parent;
import com.example.schoolmate.common.entity.Profile;
import com.example.schoolmate.common.entity.Student;
import com.example.schoolmate.common.entity.constant.UserRole;
import com.example.schoolmate.common.repository.ParentRepository;
import com.example.schoolmate.common.repository.ProfileRepository;
import com.example.schoolmate.common.repository.StudentRepository;
import com.example.schoolmate.dto.AuthUserDTO;
import com.example.schoolmate.dto.ChildDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Controller
@RequestMapping("/profile")
@RequiredArgsConstructor
@Log4j2
public class ProfileController {

    @Value("${com.example.schoolmate.upload.path}")
    private String uploadPath;

    private final StudentRepository studentRepository;
    private final ProfileRepository profileRepository;
    private final ParentRepository parentRepository;

    @GetMapping("/manage")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public String manageProfiles(Model model) {
        List<ChildDTO> students = studentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        model.addAttribute("students", students);
        return "profile/manage";
    }

    private ChildDTO convertToDTO(Student student) {
        String imageUrl = null;
        Profile profile = student.getProfile();
        if (profile != null && profile.getUuid() != null) {
            imageUrl = "/upload/" + profile.getPath() + "/" + profile.getUuid() + "_" + profile.getImgName();
        }

        return ChildDTO.builder()
                .id(student.getUid())
                .name(student.getName())
                .studentNumber(student.getStudentNumber())
                .grade(student.getGrade())
                .classNum(student.getClassNum())
                .profileImageUrl(imageUrl)
                .build();
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'PARENT')")
    @ResponseBody
    public ResponseEntity<?> uploadProfileImage(
            @RequestParam("studentId") Long studentId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthUserDTO authUserDTO) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("파일이 없습니다.");
        }

        // 이미지 파일인지 확인
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image")) {
            return ResponseEntity.badRequest().body("이미지 파일만 업로드 가능합니다.");
        }

        // 학생 조회
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return ResponseEntity.badRequest().body("학생을 찾을 수 없습니다.");
        }

        // PARENT인 경우 자기 자녀인지 확인
        UserRole role = authUserDTO.getCustomUserDTO().getRole();
        if (role == UserRole.PARENT) {
            Long parentId = authUserDTO.getCustomUserDTO().getUid();
            Parent parent = parentRepository.findById(parentId).orElse(null);
            if (parent == null) {
                return ResponseEntity.badRequest().body("학부모 정보를 찾을 수 없습니다.");
            }
            boolean isMyChild = parent.getChildren().stream()
                    .anyMatch(child -> child.getUid().equals(studentId));
            if (!isMyChild) {
                return ResponseEntity.status(403).body("자녀의 사진만 변경할 수 있습니다.");
            }
        }

        try {
            // 날짜별 폴더 생성
            String folderPath = makeFolder();

            // UUID 생성
            String uuid = UUID.randomUUID().toString();

            // 원본 파일명
            String originalName = file.getOriginalFilename();
            String fileName = uuid + "_" + originalName;

            // 파일 저장
            Path savePath = Paths.get(uploadPath, folderPath, fileName);
            file.transferTo(savePath);

            // Profile 엔티티 저장/업데이트
            Profile profile = student.getProfile();
            if (profile == null) {
                profile = Profile.builder()
                        .uuid(uuid)
                        .path(folderPath)
                        .imgName(originalName)
                        .user(student)
                        .build();
            } else {
                // 기존 파일 삭제
                deleteOldFile(profile);
                profile.changeUuid(uuid);
                profile.changePath(folderPath);
                profile.changeImgName(originalName);
            }

            profileRepository.save(profile);
            student.changeProfile(profile);
            studentRepository.save(student);

            String imageUrl = "/upload/" + folderPath + "/" + uuid + "_" + originalName;
            return ResponseEntity.ok().body(imageUrl);

        } catch (IOException e) {
            log.error("파일 업로드 실패", e);
            return ResponseEntity.internalServerError().body("파일 업로드에 실패했습니다.");
        }
    }

    private String makeFolder() {
        String folderPath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        File uploadFolder = new File(uploadPath, folderPath);

        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        return folderPath;
    }

    private void deleteOldFile(Profile profile) {
        if (profile.getUuid() != null) {
            String oldFilePath = uploadPath + "/" + profile.getPath() + "/" +
                    profile.getUuid() + "_" + profile.getImgName();
            File oldFile = new File(oldFilePath);
            if (oldFile.exists()) {
                oldFile.delete();
            }
        }
    }
}

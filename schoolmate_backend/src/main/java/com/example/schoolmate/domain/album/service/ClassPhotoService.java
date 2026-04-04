package com.example.schoolmate.domain.album.service;

import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.student.entity.StudentInfo;
import com.example.schoolmate.domain.teacher.entity.TeacherInfo;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.repository.UserRepository;
import com.example.schoolmate.domain.student.repository.StudentInfoRepository;
import com.example.schoolmate.domain.teacher.repository.TeacherInfoRepository;
import com.example.schoolmate.global.util.FileManager;
import com.example.schoolmate.domain.teacher.service.TeacherService;
import com.example.schoolmate.global.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.album.entity.ClassPhoto;
import com.example.schoolmate.domain.album.repository.ClassPhotoRepository;
import com.example.schoolmate.domain.school.repository.SchoolRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// [woo] 학급 앨범 서비스 — 담임교사 업로드, 학급 단위 조회

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassPhotoService {

    private final ClassPhotoRepository classPhotoRepository;
    private final TeacherInfoRepository teacherInfoRepository;
    private final StudentInfoRepository studentInfoRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final FileManager fileManager;
    private final TeacherService teacherService;

    // [woo] 학급 사진 목록 조회 — groupId 기준으로 묶어서 반환
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPhotosByClassroom(Long classroomId) {
        List<ClassPhoto> all = classPhotoRepository
                .findByClassroom_CidAndIsDeletedFalseOrderByCreateDateDesc(classroomId);

        // groupId 없는 사진은 단독 그룹으로, 있는 사진은 같은 키로 묶음
        LinkedHashMap<String, List<ClassPhoto>> grouped = new LinkedHashMap<>();
        for (ClassPhoto p : all) {
            String key = p.getGroupId() != null ? p.getGroupId() : "solo_" + p.getId();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(p);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<ClassPhoto>> entry : grouped.entrySet()) {
            List<ClassPhoto> group = entry.getValue();
            ClassPhoto first = group.get(0);

            List<Map<String, Object>> photoList = group.stream().map(p -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", p.getId());
                m.put("imageUrl", FileManager.UploadType.ALBUM.toUrl(p.getImageFilename()));
                m.put("caption", p.getCaption() != null ? p.getCaption() : "");
                return m;
            }).collect(Collectors.toList());

            Map<String, Object> g = new HashMap<>();
            g.put("groupId", entry.getKey());
            g.put("photos", photoList);
            g.put("uploaderName", first.getUploader().getName());
            g.put("createDate", first.getCreateDate() != null ? first.getCreateDate().toString() : "");
            result.add(g);
        }
        return result;
    }

    // [woo] 담임 학급 사진 목록 조회 (교사 본인 학급)
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyClassPhotos(Long teacherUid) {
        Classroom classroom = getMyClassroom(teacherUid);
        return getPhotosByClassroom(classroom.getCid());
    }

    // [woo] 사진 업로드 (담임교사 전용) — groupId로 묶음 업로드 지원
    @Transactional
    public Map<String, Object> uploadPhoto(Long teacherUid, MultipartFile file, String caption, String groupId) {
        Classroom classroom = getMyClassroom(teacherUid);
        User uploader = userRepository.findById(teacherUid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        String filename = fileManager.upload(file, FileManager.UploadType.ALBUM);
        if (filename == null) throw new IllegalArgumentException("파일 업로드에 실패했습니다.");

        ClassPhoto photo = ClassPhoto.builder()
                .classroom(classroom)
                .uploader(uploader)
                .imageFilename(filename)
                .caption(caption)
                .groupId(groupId != null && !groupId.isBlank() ? groupId : null)
                .build();

        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId != null) {
            schoolRepository.findById(schoolId).ifPresent(photo::setSchool);
        }

        ClassPhoto saved = classPhotoRepository.save(photo);
        log.info("[woo] 학급 앨범 사진 업로드: classroom={}, uploader={}", classroom.getCid(), uploader.getName());

        return Map.of(
                "id", saved.getId(),
                "imageUrl", FileManager.UploadType.ALBUM.toUrl(saved.getImageFilename()),
                "caption", saved.getCaption() != null ? saved.getCaption() : "",
                "uploaderName", uploader.getName(),
                "createDate", saved.getCreateDate() != null ? saved.getCreateDate().toString() : ""
        );
    }

    // [woo] 사진 삭제 (업로드한 교사 또는 관리자)
    @Transactional
    public void deletePhoto(Long photoId, Long requestUid, boolean isAdmin) {
        ClassPhoto photo = classPhotoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("사진을 찾을 수 없습니다."));

        if (!isAdmin && !photo.getUploader().getUid().equals(requestUid)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

        photo.setDeleted(true);
        fileManager.delete(photo.getImageFilename(), FileManager.UploadType.ALBUM);
        log.info("[woo] 학급 앨범 사진 삭제: photoId={}", photoId);
    }

    // [woo] 사진 캡션 수정 (업로드한 교사 또는 관리자)
    @Transactional
    public void updateCaption(Long photoId, String caption, Long requestUid, boolean isAdmin) {
        ClassPhoto photo = classPhotoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("사진을 찾을 수 없습니다."));

        if (!isAdmin && !photo.getUploader().getUid().equals(requestUid)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        photo.setCaption(caption);
        log.info("[woo] 학급 앨범 캡션 수정: photoId={}", photoId);
    }

    // [woo] 학생 기반 학급 사진 조회 (학부모/학생용 — studentInfoId로 해당 반 사진)
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPhotosByStudent(Long studentInfoId) {
        StudentInfo studentInfo = studentInfoRepository.findById(studentInfoId)
                .orElseThrow(() -> new IllegalArgumentException("학생 정보를 찾을 수 없습니다."));
        if (studentInfo.getCurrentAssignment() == null || studentInfo.getCurrentAssignment().getClassroom() == null) {
            throw new IllegalArgumentException("학생의 학급 배정 정보가 없습니다.");
        }
        Long classroomId = studentInfo.getCurrentAssignment().getClassroom().getCid();
        return getPhotosByClassroom(classroomId);
    }

    // [woo] 담임 학급 조회 헬퍼
    private Classroom getMyClassroom(Long teacherUid) {
        TeacherInfo teacherInfo = teacherInfoRepository.findByUserUid(teacherUid)
                .orElseThrow(() -> new IllegalArgumentException("교사 정보를 찾을 수 없습니다."));
        int currentYear = LocalDate.now().getYear();
        return teacherService.getMyClassroom(teacherInfo.getId(), currentYear)
                .orElseThrow(() -> new IllegalArgumentException("담임 학급 정보를 찾을 수 없습니다."));
    }
}

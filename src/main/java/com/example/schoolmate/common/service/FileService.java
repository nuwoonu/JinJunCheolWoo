package com.example.schoolmate.common.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileService {

    // 로컬 개발 환경용 업로드 루트 경로
    private final String uploadRoot = System.getProperty("user.dir") + "/src/main/resources/static/uploads/";

    public String upload(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            String uploadDir = uploadRoot + subDirectory + "/";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            // 날짜_UUID.확장자 형식으로 저장
            String savedFilename = java.time.LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
                    + "_" + UUID.randomUUID().toString() + extension;

            file.transferTo(new File(uploadDir + savedFilename));
            return savedFilename;
        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 실패", e);
        }
    }

    public void delete(String filename, String subDirectory) {
        if (filename == null || filename.isBlank())
            return;
        File file = new File(uploadRoot + subDirectory + "/" + filename);
        if (file.exists())
            file.delete();
    }
}
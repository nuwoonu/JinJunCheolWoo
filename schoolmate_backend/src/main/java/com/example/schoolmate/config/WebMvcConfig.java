package com.example.schoolmate.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${com.example.schoolmate.upload.path}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /upload/** URL로 접근하면 실제 파일 시스템의 uploadPath에서 파일을 제공
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:" + uploadPath + "/");

        // [추가] 로컬 개발 환경에서 업로드된 파일을 즉시 확인하기 위한 설정 (/uploads/**)
        // Service에서 저장하는 경로(src/main/resources/static/uploads/)를 직접 매핑하여 지연 없이 표시
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(
                        "file:///" + System.getProperty("user.dir") + "/src/main/resources/static/uploads/");
    }
}

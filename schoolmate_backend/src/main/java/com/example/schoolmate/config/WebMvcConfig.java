package com.example.schoolmate.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.example.schoolmate.config.school.SchoolInterceptor;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

        @Value("${com.example.schoolmate.upload.path}")
        private String uploadPath;

        @Override
        public void addInterceptors(InterceptorRegistry registry) {
                // 어드민 API 요청에 X-School-Id 헤더를 처리하여 SchoolContextHolder에 저장
                registry.addInterceptor(new SchoolInterceptor())
                                .addPathPatterns("/api/admin/**");
        }

        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // /upload/** URL로 접근하면 실제 파일 시스템의 uploadPath에서 파일을 제공
                registry.addResourceHandler("/upload/**")
                                .addResourceLocations("file:" + uploadPath + "/");

                // [woo] 업로드 파일 제공 - src 밖 schoolmate_backend/uploads/ 매핑
                registry.addResourceHandler("/uploads/**")
                                .addResourceLocations(
                                                "file:///" + System.getProperty("user.dir")
                                                                + "/uploads/");
        }
}

package com.example.schoolmate.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.example.schoolmate.global.config.school.SchoolInterceptor;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

        @Override
        public void addInterceptors(InterceptorRegistry registry) {
                // X-School-Id 헤더를 읽어 SchoolContextHolder에 저장
                // - 어드민 API: adminApi.ts 인터셉터가 헤더 자동 첨부
                // - 기숙사 등 학교 스코프가 필요한 일반 API도 포함
                registry.addInterceptor(new SchoolInterceptor())
                                .addPathPatterns("/api/admin/**", "/api/dormitories/**");
        }

        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // FileManager가 저장하는 절대 경로({user.dir}/uploads/)와 동일하게 매핑
                String uploadsAbsPath = "file:///" + System.getProperty("user.dir") + "/uploads/";
                registry.addResourceHandler("/upload/**")
                                .addResourceLocations(uploadsAbsPath);
                registry.addResourceHandler("/uploads/**")
                                .addResourceLocations(uploadsAbsPath);
        }
}

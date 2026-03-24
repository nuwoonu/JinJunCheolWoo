package com.example.schoolmate.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.example.schoolmate.config.school.SchoolInterceptor;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

        @Override
        public void addInterceptors(InterceptorRegistry registry) {
                // 어드민 API 요청에 X-School-Id 헤더를 처리하여 SchoolContextHolder에 저장
                registry.addInterceptor(new SchoolInterceptor())
                                .addPathPatterns("/api/admin/**");
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

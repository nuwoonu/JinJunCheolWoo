package com.example.schoolmate.config;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.HashMap;
import java.util.Map;

/**
 * 전역 URL 상수 바인딩 어드바이스
 * 
 * SchoolmateUrls 클래스에 정의된 public static final String 상수들을
 * 리플렉션으로 읽어와 모든 뷰의 Model에 'urls' 맵으로 자동 추가합니다.
 */
@ControllerAdvice(basePackages = "com.example.schoolmate")
public class UrlControllerAdvice {

    @ModelAttribute("urls")
    public Map<String, String> urls() {
        Map<String, String> urls = new HashMap<>();
        Field[] fields = SchoolmateUrls.class.getDeclaredFields();

        for (Field field : fields) {
            int modifiers = field.getModifiers();
            if (Modifier.isPublic(modifiers) && Modifier.isStatic(modifiers) && Modifier.isFinal(modifiers)
                    && field.getType().equals(String.class)) {
                try {
                    urls.put(field.getName(), (String) field.get(null));
                } catch (IllegalAccessException e) {
                }
            }
        }
        return urls;
    }
}

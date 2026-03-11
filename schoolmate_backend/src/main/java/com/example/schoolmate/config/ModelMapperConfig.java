package com.example.schoolmate.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    // Entity <-> DTO 변환을 위한 ModelMapper 빈 등록
    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration()
                .setFieldMatchingEnabled(true) // 필드명 같은 경우 매핑
                .setFieldAccessLevel(org.modelmapper.config.Configuration.AccessLevel.PRIVATE) // getter/setter 없이도
                                                                                               // private 필드 접근
                .setMatchingStrategy(MatchingStrategies.LOOSE); // 유연한 매칭: userName ↔ user_name 가능
        return modelMapper;
    }
}

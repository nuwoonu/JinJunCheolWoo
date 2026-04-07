package com.example.schoolmate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
@EnableAsync // [woo] App push 알림기능활성화 @Async 메서드 활성화
public class SchoolmateApplication {

	public static void main(String[] args) {
		SpringApplication.run(SchoolmateApplication.class, args);
	}
}

package com.example.schoolmate.common.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void sendPasswordVerificationCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("[Schoolmate] 비밀번호 변경 인증 코드");
        message.setText(
                "비밀번호 변경을 위한 인증 코드입니다.\n\n" +
                "인증 코드: " + code + "\n\n" +
                "5분 이내에 입력해주세요.\n" +
                "본인이 요청하지 않은 경우 이 메일을 무시하세요."
        );
        mailSender.send(message);
        log.info("비밀번호 변경 인증 코드 발송 완료: {}", to);
    }

    public void sendWithdrawalVerificationCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("[Schoolmate] 회원 탈퇴 인증 코드");
        message.setText(
                "회원 탈퇴를 위한 인증 코드입니다.\n\n" +
                "인증 코드: " + code + "\n\n" +
                "5분 이내에 입력해주세요.\n" +
                "본인이 요청하지 않은 경우 이 메일을 무시하세요."
        );
        mailSender.send(message);
        log.info("회원 탈퇴 인증 코드 발송 완료: {}", to);
    }
}

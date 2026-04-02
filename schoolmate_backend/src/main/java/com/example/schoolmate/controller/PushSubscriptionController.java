package com.example.schoolmate.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.schoolmate.common.dto.PushSubscriptionDTO;
import com.example.schoolmate.common.entity.notification.PushSubscription;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.repository.UserRepository;
import com.example.schoolmate.common.repository.notice.PushSubscriptionRepository;
import com.example.schoolmate.dto.AuthUserDTO;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserRepository userRepository;

    // 구독 정보 저장 (알림 허용 후 프론트에서 호출)
    @PostMapping("/subscribe")
    @Transactional
    public ResponseEntity<Void> subscribe(
            @Valid @RequestBody PushSubscriptionDTO.SubscribeRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        if (authUser == null) return ResponseEntity.status(401).build();

        User user = userRepository.findById(authUser.getCustomUserDTO().getUid())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 동일 endpoint가 이미 존재하면 덮어쓰기 (재구독 시나리오 처리)
        pushSubscriptionRepository.findByUserAndEndpoint(user, request.getEndpoint())
                .ifPresent(pushSubscriptionRepository::delete);

        PushSubscription subscription = PushSubscription.builder()
                .user(user)
                .endpoint(request.getEndpoint())
                .p256dhKey(request.getP256dhKey())
                .authKey(request.getAuthKey())
                .build();

        pushSubscriptionRepository.save(subscription);
        return ResponseEntity.ok().build();
    }

    // 구독 해제 (알림 거부 또는 로그아웃 시 호출)
    @DeleteMapping("/subscribe")
    @Transactional
    public ResponseEntity<Void> unsubscribe(
            @Valid @RequestBody PushSubscriptionDTO.UnsubscribeRequest request,
            @AuthenticationPrincipal AuthUserDTO authUser) {

        if (authUser == null) return ResponseEntity.status(401).build();

        User user = userRepository.findById(authUser.getCustomUserDTO().getUid())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        pushSubscriptionRepository.deleteByUserAndEndpoint(user, request.getEndpoint());
        return ResponseEntity.ok().build();
    }
}

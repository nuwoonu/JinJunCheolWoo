package com.example.schoolmate.common.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class PushSubscriptionDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    public static class SubscribeRequest {
        @NotBlank
        private String endpoint;
        @NotBlank
        private String p256dhKey;
        @NotBlank
        private String authKey;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class UnsubscribeRequest {
        @NotBlank
        private String endpoint;
    }
}

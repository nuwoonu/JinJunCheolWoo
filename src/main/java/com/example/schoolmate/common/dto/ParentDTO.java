package com.example.schoolmate.common.dto;

import com.example.schoolmate.common.entity.info.ParentInfo;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class ParentDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    public static class QuickRegisterRequest {
        private Long studentUid;
        private String parentName;
        private String phoneNumber;
        private String relationship; // FATHER, MOTHER 등
        private boolean representative;
    }

    @Getter
    public static class Summary {
        private Long id;
        private String name;
        private String phone;
        private String status;
        private boolean linked;

        public Summary(ParentInfo entity) {
            this.id = entity.getId();
            this.name = entity.getParentName();
            this.phone = entity.getPhoneNumber();
            this.status = entity.getStatus().getDescription();
            this.linked = entity.getUser() != null;
        }
    }
}
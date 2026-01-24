package com.example.schoolmate.dto;

import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Builder
public class ChildDTO {
    private Long id;
    private String name;
    private String studentNumber; // 학번
    private Integer grade; // 학년
    private Integer classNum; // 반

    // 프로필 이미지 정보
    private String profileImageUrl; // 이미지 URL (uuid + path 조합)

    // 이미지 URL 생성 메서드
    public String getProfileImageUrl() {
        if (profileImageUrl == null || profileImageUrl.isEmpty()) {
            return "/images/thumbs/student-details-img.png"; // 기본 이미지
        }
        return profileImageUrl;
    }
}

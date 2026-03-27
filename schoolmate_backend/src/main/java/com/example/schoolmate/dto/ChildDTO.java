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
    private Long studentInfoId; // [woo] 출결 조회용 StudentInfo.id
    private String name;
    private Integer grade; // 학년
    private Integer classNum; // 반
    private Integer attendanceNum; // 번호 (가나다 이름순)
    private String studentNumber; // 학번

    // [soojin] 학부모 대시보드에서 자녀 학교 기준으로 NEIS 급식 조회에 사용
    private Long schoolId;
    private String schoolName; // 학교명

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

package com.example.schoolmate.common.entity.user.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AchievementsGrade {
    GOLD("금상"),
    SILVER("은상"),
    BRONZE("동상"),
    HONORABLE_MENTION("장려");

    private final String achievementsGrade;
}

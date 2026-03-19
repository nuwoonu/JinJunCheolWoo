package com.example.schoolmate.common.repository;

import java.util.List;

import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;

public interface UserRepositoryCustom {

    /** 특정 역할을 보유한 사용자 전체 조회 */
    List<User> findAllByRole(UserRole role);
}

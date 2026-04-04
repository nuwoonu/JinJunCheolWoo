package com.example.schoolmate.domain.user.repository;

import java.util.List;

import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.UserRole;

public interface UserRepositoryCustom {

    /** 특정 역할을 보유한 사용자 전체 조회 */
    List<User> findAllByRole(UserRole role);
}

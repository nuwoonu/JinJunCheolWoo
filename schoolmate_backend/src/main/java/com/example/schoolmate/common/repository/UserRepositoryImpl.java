package com.example.schoolmate.common.repository;

import java.util.List;

import com.example.schoolmate.common.entity.user.QUser;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepositoryCustom {

    private final JPAQueryFactory query;

    @Override
    public List<User> findAllByRole(UserRole role) {
        QUser user = QUser.user;
        return query.selectFrom(user)
                .where(user.roles.contains(role))
                .fetch();
    }
}
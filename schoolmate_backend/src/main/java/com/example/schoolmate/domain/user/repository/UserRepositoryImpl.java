package com.example.schoolmate.domain.user.repository;

import java.util.List;

import com.example.schoolmate.domain.user.entity.QUser;
import com.example.schoolmate.domain.user.entity.User;
import com.example.schoolmate.domain.user.entity.constant.UserRole;
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
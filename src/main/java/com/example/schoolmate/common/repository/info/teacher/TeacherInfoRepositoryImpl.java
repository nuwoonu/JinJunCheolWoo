package com.example.schoolmate.common.repository.info.teacher;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.QTeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.QUser;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class TeacherInfoRepositoryImpl implements TeacherInfoRepositoryCustom {
    private final JPAQueryFactory query;

    @Override
    public Page<User> search(TeacherDTO.TeacherSearchCondition cond, Pageable pageable) {
        QUser user = QUser.user;
        QTeacherInfo info = QTeacherInfo.teacherInfo;

        BooleanExpression isTeacher = user.roles.contains(UserRole.TEACHER);
        BooleanExpression searchFilter = searchPredicate(cond.getType(), cond.getKeyword());
        BooleanExpression statusFilter = statusFilter(cond.getStatus());

        JPAQuery<User> contentQuery = query
                .selectFrom(user).distinct()
                .leftJoin(info).on(info.user.eq(user))
                .where(
                        isTeacher,
                        searchFilter,
                        statusFilter)
                .orderBy(user.uid.desc());

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        List<User> content = contentQuery.fetch();

        JPAQuery<Long> countQuery = query
                .select(user.countDistinct())
                .from(user)
                .leftJoin(info).on(info.user.eq(user))
                .where(
                        isTeacher,
                        searchFilter,
                        statusFilter);

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression statusFilter(String status) {
        if (status == null || status.isEmpty())
            return null;
        QTeacherInfo info = QTeacherInfo.teacherInfo;
        return info.status.eq(TeacherStatus.valueOf(status));
    }

    private BooleanExpression searchPredicate(String type, String keyword) {
        if (keyword == null || keyword.isEmpty())
            return null;

        QUser user = QUser.user;
        QTeacherInfo info = QTeacherInfo.teacherInfo;

        return switch (type) {
            case "name" -> user.name.contains(keyword);
            case "email" -> user.email.contains(keyword);
            case "dept" -> info.department.contains(keyword);
            case "subject" -> info.subject.contains(keyword);
            case "position" -> info.position.contains(keyword);
            default -> null;
        };
    }

    @Override
    public Optional<User> findTeacherByCode(String code) {
        QUser user = QUser.user;
        QTeacherInfo info = QTeacherInfo.teacherInfo;

        User result = query.selectFrom(user)
                .join(info).on(info.user.eq(user))
                .where(info.code.eq(code))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    @Override
    public long countByStatus(TeacherStatus status) {
        QTeacherInfo info = QTeacherInfo.teacherInfo;
        Long count = query.select(info.count())
                .from(info)
                .where(info.status.eq(status))
                .fetchOne();
        return count != null ? count : 0L;
    }
}
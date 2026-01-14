package com.example.schoolmate.common.repository;

import java.util.List;

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
public class UserRepositoryImpl implements UserRepositoryCustom {
    private final JPAQueryFactory query;

    @Override
    public Page<User> searchTeachers(TeacherDTO.TeacherSearchCondition cond, Pageable pageable) {
        QUser user = QUser.user;
        QTeacherInfo info = QTeacherInfo.teacherInfo;

        // 1. 컨텐츠 조회 (중복 제거 및 검색용 조인 추가)
        List<User> content = query
                .selectFrom(user).distinct()
                .leftJoin(user.infos, info._super)
                .where(
                        user.roles.contains(UserRole.TEACHER),
                        searchPredicate(cond.getType(), cond.getKeyword()),
                        retiredFilter(cond.isIncludeRetired()))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(user.uid.desc())
                .fetch();

        // 2. 카운트 조회
        JPAQuery<Long> countQuery = query
                .select(user.countDistinct()) // 💡 카운트 시에도 중복을 제외한 유저 수만 계산
                .from(user)
                .leftJoin(user.infos, info._super)
                .where(
                        user.roles.contains(UserRole.TEACHER),
                        searchPredicate(cond.getType(), cond.getKeyword()));

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression retiredFilter(boolean includeRetired) {
        if (includeRetired) {
            return null; // 스위치가 ON이면 아무런 제약을 두지 않음 (퇴직자 포함)
        }
        // 스위치가 OFF이면 상태가 RETIRED가 아닌 것만 조회
        return QTeacherInfo.teacherInfo.status.ne(TeacherStatus.RETIRED);
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
}
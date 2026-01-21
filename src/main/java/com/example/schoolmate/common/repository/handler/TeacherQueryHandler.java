package com.example.schoolmate.common.repository.handler;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Component;

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

@Component
@RequiredArgsConstructor
public class TeacherQueryHandler {
    private final JPAQueryFactory query;

    public Page<User> search(TeacherDTO.TeacherSearchCondition cond, Pageable pageable) {
        QUser user = QUser.user;
        QTeacherInfo info = QTeacherInfo.teacherInfo;

        // 공통 필터 조건 정의
        BooleanExpression isTeacher = user.roles.contains(UserRole.TEACHER);
        BooleanExpression searchFilter = searchPredicate(cond.getType(), cond.getKeyword());
        BooleanExpression retiredFilter = retiredFilter(cond.isIncludeRetired());

        // 1. 컨텐츠 조회
        List<User> content = query
                .selectFrom(user).distinct()
                .leftJoin(info).on(info.user.eq(user)) // TeacherInfo와 직접 조인
                .where(
                        isTeacher,
                        searchFilter,
                        retiredFilter // 퇴직자 필터 적용
                )
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(user.uid.desc())
                .fetch();

        // 2. 카운트 조회 (페이징을 위해 컨텐츠 쿼리와 동일한 필터 적용)
        JPAQuery<Long> countQuery = query
                .select(user.countDistinct())
                .from(user)
                .leftJoin(info).on(info.user.eq(user))
                .where(
                        isTeacher,
                        searchFilter,
                        retiredFilter);

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    /**
     * 퇴직자 필터 로직
     * includeRetired가 false일 때, RETIRED가 아닌 모든 상태(EMPLOYED, LEAVE)와
     * 아직 상태가 지정되지 않은(NULL) 데이터까지 모두 포함하도록 수정
     */
    private BooleanExpression retiredFilter(boolean includeRetired) {
        if (includeRetired) {
            return null;
        }

        QTeacherInfo info = QTeacherInfo.teacherInfo;

        // "상태가 RETIRED가 아니거나" OR "상태가 아예 없는(NULL) 경우" 둘 다 포함
        return info.status.ne(TeacherStatus.RETIRED)
                .or(info.status.isNull());
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

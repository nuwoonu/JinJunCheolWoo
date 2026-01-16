package com.example.schoolmate.common.repository.handler;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Component;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.QFamilyRelation;
import com.example.schoolmate.common.entity.info.QParentInfo;
import com.example.schoolmate.common.entity.info.QStudentInfo;
import com.example.schoolmate.common.entity.info.assignment.QStudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.QUser;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StudentQueryHandler {
    private final JPAQueryFactory query;

    public Page<User> search(StudentDTO.StudentSearchCondition cond, Pageable pageable) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;

        List<User> content = query
                .selectFrom(user)
                .leftJoin(user.infos, info._super)
                .where(
                        user.roles.contains(UserRole.STUDENT),
                        searchPredicate(cond.getType(), cond.getKeyword(), user, info),
                        inactiveFilter(cond.isIncludeInactive(), info))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(user.uid.desc())
                .fetch();

        JPAQuery<Long> countQuery = query
                .select(user.count())
                .from(user)
                .leftJoin(user.infos, info._super)
                .where(
                        user.roles.contains(UserRole.STUDENT),
                        searchPredicate(cond.getType(), cond.getKeyword(), user, info),
                        inactiveFilter(cond.isIncludeInactive(), info));

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression inactiveFilter(boolean includeInactive, QStudentInfo info) {
        if (includeInactive)
            return null;
        // 재학, 휴학 상태만 기본 노출
        return info.status.in(StudentStatus.ENROLLED, StudentStatus.LEAVE_OF_ABSENCE).or(info.status.isNull());
    }

    private BooleanExpression searchPredicate(String type, String keyword, QUser user, QStudentInfo info) {
        if (keyword == null || keyword.isEmpty())
            return null;
        return switch (type) {
            case "name" -> user.name.contains(keyword);
            case "email" -> user.email.contains(keyword);
            case "idNum" -> info.studentIdentityNum.contains(keyword);
            default -> null;
        };
    }

    public Optional<User> findDetailByIdentityNum(String identityNum) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QFamilyRelation relation = QFamilyRelation.familyRelation;
        QParentInfo parent = QParentInfo.parentInfo;

        User result = query
                .selectFrom(user)
                // StudentInfo 조인
                .innerJoin(user.infos, info._super).fetchJoin()
                // 학적 이력 조인 (최신순 정렬을 위해 fetchJoin 유지)
                .leftJoin(info.assignments, assign).fetchJoin()
                // 보호자 관계 및 보호자 정보 조인
                .leftJoin(info.familyRelations, relation).fetchJoin()
                .leftJoin(relation.parentInfo, parent).fetchJoin()
                .where(
                        info.studentIdentityNum.eq(identityNum),
                        user.roles.contains(UserRole.STUDENT))
                .fetchOne();

        return Optional.ofNullable(result);
    }

    /**
     * 고유 학번 중복 여부 확인
     */
    public boolean existsByIdentityNum(String identityNum) {
        QStudentInfo info = QStudentInfo.studentInfo;
        Integer fetchOne = query
                .selectOne()
                .from(info)
                .where(info.studentIdentityNum.eq(identityNum))
                .fetchFirst(); // findAny와 같은 역할 (성능 최적화)

        return fetchOne != null;
    }
}
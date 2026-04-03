package com.example.schoolmate.common.repository.info.teacher;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.cheol.entity.QSubject;
import com.example.schoolmate.common.dto.TeacherDTO;
import com.example.schoolmate.common.entity.info.QTeacherInfo;
import com.example.schoolmate.common.entity.info.constant.TeacherStatus;
import com.example.schoolmate.common.entity.user.QRoleRequest;
import com.example.schoolmate.common.entity.user.QUser;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.RoleRequestStatus;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.example.schoolmate.config.school.SchoolQueryFilter;
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
        QRoleRequest roleRequest = QRoleRequest.roleRequest; // [soojin] 대시보드 대기 목록 필터링용

        BooleanExpression isTeacher = user.roles.contains(UserRole.TEACHER);
        BooleanExpression searchFilter = searchPredicate(cond.getType(), cond.getKeyword());
        BooleanExpression statusFilter = statusFilter(cond.getStatus());
        BooleanExpression schoolFilter = SchoolQueryFilter.schoolIdEq(info.school.id);

        // cheol
        QSubject subject = QSubject.subject;

        JPAQuery<User> contentQuery = query
                .selectFrom(user)
                .leftJoin(info).on(info.user.eq(user))
                .leftJoin(subject).on(info.subject.eq(subject))
                .leftJoin(roleRequest).on(roleRequest.user.eq(user).and(roleRequest.role.eq(UserRole.TEACHER))) // [soojin] roleRequest 조인
                .where(isTeacher, searchFilter, statusFilter, schoolFilter,
                        roleRequestStatusFilter(cond.getRoleRequestStatus(), roleRequest)); // [soojin] 승인상태 필터

        // [soojin] roleRequestStatus 필터 시 최신 요청순 정렬, 기본은 uid 내림차순
        // [soojin] MySQL: DISTINCT + ORDER BY(SELECT 미포함 컬럼) 충돌 → roleRequestStatus 필터 시 DISTINCT 제거
        if (cond.getRoleRequestStatus() != null) {
            contentQuery.orderBy(roleRequest.createDate.desc());
        } else {
            contentQuery.groupBy(user.uid);
            contentQuery.orderBy(info.code.max().desc());
        }

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        List<User> content = contentQuery.fetch();

        JPAQuery<Long> countQuery = query
                .select(user.countDistinct())
                .from(user)
                .leftJoin(info).on(info.user.eq(user))
                .leftJoin(subject).on(info.subject.eq(subject))
                .leftJoin(roleRequest).on(roleRequest.user.eq(user).and(roleRequest.role.eq(UserRole.TEACHER))) // [soojin]
                .where(isTeacher, searchFilter, statusFilter, schoolFilter,
                        roleRequestStatusFilter(cond.getRoleRequestStatus(), roleRequest)); // [soojin]

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression statusFilter(String status) {
        if (status == null || status.isEmpty())
            return null;
        QTeacherInfo info = QTeacherInfo.teacherInfo;
        return info.status.eq(TeacherStatus.valueOf(status));
    }

    private BooleanExpression roleRequestStatusFilter(String status, QRoleRequest roleRequest) { // [soojin] 대시보드 대기 목록 필터링용
        if (status == null || status.isEmpty())
            return null;
        return roleRequest.status.eq(RoleRequestStatus.valueOf(status));
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
            case "subject" -> info.subject.name.contains(keyword); // cheol
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
                .where(info.code.eq(code), SchoolQueryFilter.schoolIdEq(info.school.id))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    @Override
    public long countByStatus(TeacherStatus status) {
        QTeacherInfo info = QTeacherInfo.teacherInfo;
        Long count = query.select(info.count())
                .from(info)
                .where(info.status.eq(status), SchoolQueryFilter.schoolIdEq(info.school.id))
                .fetchOne();
        return count != null ? count : 0L;
    }
}

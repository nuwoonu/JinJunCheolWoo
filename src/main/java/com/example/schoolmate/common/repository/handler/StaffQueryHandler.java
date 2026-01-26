package com.example.schoolmate.common.repository.handler;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Component;

import com.example.schoolmate.common.dto.StaffDTO;
import com.example.schoolmate.common.entity.info.QStaffInfo;
import com.example.schoolmate.common.entity.info.constant.EmploymentType;
import com.example.schoolmate.common.entity.info.constant.StaffStatus;
import com.example.schoolmate.common.entity.user.QUser;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StaffQueryHandler {
    private final JPAQueryFactory query;

    public Page<User> search(StaffDTO.StaffSearchCondition cond, Pageable pageable) {
        QUser user = QUser.user;
        QStaffInfo info = QStaffInfo.staffInfo;

        BooleanExpression isStaff = user.roles.contains(UserRole.STAFF);
        BooleanExpression searchFilter = searchPredicate(cond.getType(), cond.getKeyword());
        BooleanExpression statusFilter = statusFilter(cond.getStatus());
        BooleanExpression employmentTypeFilter = employmentTypeFilter(cond.getEmploymentType());

        JPAQuery<User> contentQuery = query
                .selectFrom(user).distinct()
                .leftJoin(info).on(info.user.eq(user))
                .where(isStaff, searchFilter, statusFilter, employmentTypeFilter)
                .orderBy(user.uid.desc());

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        List<User> content = contentQuery.fetch();

        JPAQuery<Long> countQuery = query
                .select(user.countDistinct())
                .from(user)
                .leftJoin(info).on(info.user.eq(user))
                .where(isStaff, searchFilter, statusFilter, employmentTypeFilter);

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression statusFilter(String status) {
        if (status == null || status.isEmpty())
            return null;
        QStaffInfo info = QStaffInfo.staffInfo;
        return info.status.eq(StaffStatus.valueOf(status));
    }

    private BooleanExpression employmentTypeFilter(String employmentType) {
        if (employmentType == null || employmentType.isEmpty())
            return null;
        QStaffInfo info = QStaffInfo.staffInfo;
        return info.employmentType.eq(EmploymentType.valueOf(employmentType));
    }

    private BooleanExpression searchPredicate(String type, String keyword) {
        if (keyword == null || keyword.isEmpty())
            return null;
        QUser user = QUser.user;
        QStaffInfo info = QStaffInfo.staffInfo;

        return switch (type) {
            case "name" -> user.name.contains(keyword);
            case "email" -> user.email.contains(keyword);
            case "dept" -> info.department.contains(keyword);
            case "jobTitle" -> info.jobTitle.contains(keyword);
            case "code" -> info.code.contains(keyword);
            case "extNum" -> info.extensionNumber.contains(keyword);
            default -> null;
        };
    }

    public long countByStatus(StaffStatus status) {
        QStaffInfo info = QStaffInfo.staffInfo;
        Long count = query.select(info.count())
                .from(info)
                .where(info.status.eq(status))
                .fetchOne();
        return count != null ? count : 0L;
    }
}

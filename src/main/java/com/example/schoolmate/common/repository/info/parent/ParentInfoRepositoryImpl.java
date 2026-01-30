package com.example.schoolmate.common.repository.info.parent;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.QFamilyRelation;
import com.example.schoolmate.common.entity.info.QParentInfo;
import com.example.schoolmate.common.entity.info.QStudentInfo;
import com.example.schoolmate.common.entity.info.constant.ParentStatus;
import com.example.schoolmate.common.entity.user.QUser;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ParentInfoRepositoryImpl implements ParentInfoRepositoryCustom {

    private final JPAQueryFactory query;

    @Override
    public Page<ParentInfo> search(ParentDTO.ParentSearchCondition cond, Pageable pageable) {
        QParentInfo parent = QParentInfo.parentInfo;
        QUser user = QUser.user;
        QFamilyRelation relation = QFamilyRelation.familyRelation;
        QStudentInfo student = QStudentInfo.studentInfo;
        QUser studentUser = new QUser("studentUser");

        JPAQuery<Long> idsQuery = query
                .select(parent.id)
                .from(parent)
                .leftJoin(parent.user, user)
                .leftJoin(parent.childrenRelations, relation)
                .leftJoin(relation.studentInfo, student)
                .leftJoin(student.user, studentUser)
                .where(searchPredicate(cond.getType(), cond.getKeyword(), parent, user, studentUser),
                        statusFilter(cond.getStatus(), parent))
                .distinct()
                .orderBy(parent.id.desc());

        if (pageable.isPaged()) {
            idsQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        List<Long> ids = idsQuery.fetch();

        List<ParentInfo> content = query
                .selectFrom(parent)
                .distinct()
                .leftJoin(parent.user, user).fetchJoin()
                .leftJoin(parent.childrenRelations, relation).fetchJoin()
                .leftJoin(relation.studentInfo, student).fetchJoin()
                .leftJoin(student.user, studentUser).fetchJoin()
                .where(parent.id.in(ids))
                .orderBy(parent.id.desc())
                .fetch();

        JPAQuery<Long> countQuery = query
                .select(parent.countDistinct())
                .from(parent)
                .leftJoin(parent.user, user)
                .leftJoin(parent.childrenRelations, relation)
                .leftJoin(relation.studentInfo, student)
                .leftJoin(student.user, studentUser)
                .where(searchPredicate(cond.getType(), cond.getKeyword(), parent, user, studentUser),
                        statusFilter(cond.getStatus(), parent));

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression statusFilter(String status, QParentInfo parent) {
        if (status == null || status.isEmpty())
            return null;
        return parent.status.eq(ParentStatus.valueOf(status));
    }

    private BooleanExpression searchPredicate(String type, String keyword,
            QParentInfo parent, QUser user, QUser studentUser) {
        if (keyword == null || keyword.isEmpty())
            return null;

        return switch (type) {
            case "name" -> parent.parentName.contains(keyword);
            case "email" -> user.email.contains(keyword);
            case "phone" -> parent.phoneNumber.contains(keyword);
            case "childName" -> studentUser.name.contains(keyword);
            default -> null;
        };
    }

    @Override
    public long countByStatus(ParentStatus status) {
        QParentInfo parent = QParentInfo.parentInfo;
        Long count = query.select(parent.count())
                .from(parent)
                .where(parent.status.eq(status))
                .fetchOne();
        return count != null ? count : 0L;
    }
}
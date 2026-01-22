package com.example.schoolmate.common.repository.handler;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Component;

import com.example.schoolmate.common.dto.ParentDTO;
import com.example.schoolmate.common.entity.info.ParentInfo;
import com.example.schoolmate.common.entity.info.QFamilyRelation;
import com.example.schoolmate.common.entity.info.QParentInfo;
import com.example.schoolmate.common.entity.info.QStudentInfo;
import com.example.schoolmate.common.entity.user.QUser;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ParentQueryHandler {

    private final JPAQueryFactory query;

    public Page<ParentInfo> search(ParentDTO.ParentSearchCondition cond, Pageable pageable) {
        QParentInfo parent = QParentInfo.parentInfo;
        QUser user = QUser.user;
        QFamilyRelation relation = QFamilyRelation.familyRelation;
        QStudentInfo student = QStudentInfo.studentInfo;
        QUser studentUser = new QUser("studentUser"); // 자녀의 User Alias

        // 1. 검색 조건에 맞는 Parent ID 조회 (페이징 적용)
        // OneToMany 관계(자녀) 조인 시 데이터 뻥튀기 방지를 위해 ID만 먼저 조회
        List<Long> ids = query
                .select(parent.id)
                .from(parent)
                .leftJoin(parent.user, user)
                .leftJoin(parent.childrenRelations, relation)
                .leftJoin(relation.studentInfo, student)
                .leftJoin(student.user, studentUser)
                .where(searchPredicate(cond.getType(), cond.getKeyword(), parent, user, studentUser))
                .distinct()
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(parent.id.desc())
                .fetch();

        // 2. 조회된 ID로 Entity Fetch Join (N+1 방지)
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

        // 3. Count Query
        JPAQuery<Long> countQuery = query
                .select(parent.countDistinct())
                .from(parent)
                .leftJoin(parent.user, user)
                .leftJoin(parent.childrenRelations, relation)
                .leftJoin(relation.studentInfo, student)
                .leftJoin(student.user, studentUser)
                .where(searchPredicate(cond.getType(), cond.getKeyword(), parent, user, studentUser));

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
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
}
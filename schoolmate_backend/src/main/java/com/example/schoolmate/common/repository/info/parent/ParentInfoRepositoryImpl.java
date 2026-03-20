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
import com.example.schoolmate.common.entity.user.QUser;
import com.example.schoolmate.config.school.SchoolContextHolder;
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
                        cond.isIgnoreSchoolFilter() ? null : schoolFilter(student))
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
                        cond.isIgnoreSchoolFilter() ? null : schoolFilter(student));

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    /**
     * [woo] 학부모는 school_id가 없으므로, 자녀(StudentInfo)의 school로 범위를 제한합니다.
     * schoolId가 null이면 전체 조회 (필터 미적용)
     * 자녀가 없는 학부모도 포함 (student가 null이거나 school이 일치)
     */
    private BooleanExpression schoolFilter(QStudentInfo student) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null)
            return null;
        // [woo] 자녀가 없는 학부모도 목록에 포함되도록 OR 조건
        return student.id.isNull().or(student.school.id.eq(schoolId));
    }

    private BooleanExpression searchPredicate(String type, String keyword,
            QParentInfo parent, QUser user, QUser studentUser) {
        if (keyword == null || keyword.isEmpty())
            return null;

        return switch (type) {
            case "name" -> parent.parentName.contains(keyword);
            case "email" -> user.email.contains(keyword);
            case "phone" -> parent.phone.contains(keyword);
            case "childName" -> studentUser.name.contains(keyword);
            default -> null;
        };
    }
}

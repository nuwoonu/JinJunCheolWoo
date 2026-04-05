package com.example.schoolmate.domain.classroom.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.domain.classroom.dto.ClassDTO;
import com.example.schoolmate.domain.classroom.entity.Classroom;
import com.example.schoolmate.domain.classroom.entity.QClassroom;
import com.example.schoolmate.domain.classroom.entity.constant.ClassroomStatus;
import com.example.schoolmate.domain.user.entity.QUser;
import com.example.schoolmate.global.config.school.SchoolQueryFilter;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ClassroomRepositoryImpl implements ClassroomRepositoryCustom {
    private final JPAQueryFactory query;

    @Override
    public Page<Classroom> search(ClassDTO.SearchCondition cond, Pageable pageable) {
        QClassroom classroom = QClassroom.classroom;
        QUser teacher = QUser.user;

        BooleanExpression filter = searchFilter(cond.getYear(), cond.getGrade(), cond.getStatus());
        BooleanExpression schoolFilter = SchoolQueryFilter.schoolIdEq(classroom.school.id);

        JPAQuery<Classroom> contentQuery = query
                .selectFrom(classroom)
                .leftJoin(classroom.teacher, teacher).fetchJoin()
                .where(filter, schoolFilter)
                .orderBy(classroom.schoolYear.year.desc(), classroom.grade.asc(), classroom.classNum.asc());

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        List<Classroom> content = contentQuery.fetch();

        JPAQuery<Long> countQuery = query
                .select(classroom.count())
                .from(classroom)
                .where(filter, schoolFilter);

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression searchFilter(Integer year, Integer grade, String status) {
        QClassroom classroom = QClassroom.classroom;
        BooleanExpression expr = null;
        if (year != null)
            expr = classroom.schoolYear.year.eq(year);
        if (grade != null)
            expr = (expr == null) ? classroom.grade.eq(grade) : expr.and(classroom.grade.eq(grade));
        if (status != null && !status.isEmpty())
            expr = (expr == null) ? classroom.status.eq(ClassroomStatus.valueOf(status))
                    : expr.and(classroom.status.eq(ClassroomStatus.valueOf(status)));
        return expr;
    }
}

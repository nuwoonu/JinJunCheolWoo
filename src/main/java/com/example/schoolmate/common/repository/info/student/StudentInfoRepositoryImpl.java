package com.example.schoolmate.common.repository.info.student;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.QClassroom;
import com.example.schoolmate.common.entity.info.QStudentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.QStudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.QUser;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class StudentInfoRepositoryImpl implements StudentInfoRepositoryCustom {

    private final JPAQueryFactory query;

    @Override
    public Page<User> search(StudentDTO.StudentSearchCondition cond, Pageable pageable) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;

        JPAQuery<User> contentQuery = query.selectFrom(user).distinct()
                .leftJoin(info).on(info.user.eq(user))
                .leftJoin(info.currentAssignment, QStudentAssignment.studentAssignment)
                .leftJoin(QStudentAssignment.studentAssignment.classroom, QClassroom.classroom)
                .where(
                        user.roles.contains(UserRole.STUDENT),
                        searchPredicate(cond.getType(), cond.getKeyword(), user, info),
                        statusFilter(cond.getStatus(), info))
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
                        user.roles.contains(UserRole.STUDENT),
                        searchPredicate(cond.getType(), cond.getKeyword(), user, info),
                        statusFilter(cond.getStatus(), info));

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    private BooleanExpression statusFilter(String status, QStudentInfo info) {
        if (status == null || status.isEmpty())
            return null;
        return info.status.eq(StudentStatus.valueOf(status));
    }

    private BooleanExpression searchPredicate(String type, String keyword, QUser user, QStudentInfo info) {
        if (keyword == null || keyword.isEmpty())
            return null;
        return switch (type) {
            case "name" -> user.name.contains(keyword);
            case "email" -> user.email.contains(keyword);
            case "idNum" -> info.code.contains(keyword);
            default -> null;
        };
    }

    @Override
    public Optional<User> findDetailByCode(String code) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom classroom = QClassroom.classroom;

        StudentInfo result = query
                .selectFrom(info)
                .innerJoin(info.user, user).fetchJoin()
                .leftJoin(info.assignments, assign).fetchJoin()
                .leftJoin(assign.classroom, classroom).fetchJoin()
                .where(
                        info.code.eq(code),
                        user.roles.contains(UserRole.STUDENT))
                .fetchOne();

        return Optional.ofNullable(result).map(StudentInfo::getUser);
    }

    @Override
    public boolean existsByCode(String code) {
        QStudentInfo info = QStudentInfo.studentInfo;
        Integer fetchOne = query
                .selectOne()
                .from(info)
                .where(info.code.eq(code))
                .fetchFirst();
        return fetchOne != null;
    }

    @Override
    public List<User> findStudentsByAssignment(int year, int grade, int classNum) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom classroom = QClassroom.classroom;

        return query.selectFrom(user)
                .join(info).on(info.user.eq(user))
                .join(info.assignments, assign)
                .join(assign.classroom, classroom)
                .where(classroom.year.eq(year)
                        .and(classroom.grade.eq(grade))
                        .and(classroom.classNum.eq(classNum)))
                .fetch();
    }

    @Override
    public List<User> findUnassignedStudents(int year, int limit) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;

        List<User> candidates = query.selectFrom(user)
                .join(info).on(info.user.eq(user))
                .where(
                        user.roles.contains(UserRole.STUDENT),
                        info.status.eq(StudentStatus.ENROLLED),
                        query.selectOne().from(assign)
                                .where(assign.studentInfo.eq(info).and(assign.schoolYear.eq(year)))
                                .notExists())
                .fetch();

        Collections.shuffle(candidates);
        return candidates.stream().limit(limit).toList();
    }

    @Override
    public long countByClassroom(int year, int grade, int classNum) {
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom classroom = QClassroom.classroom;

        Long count = query.select(info.count())
                .from(info)
                .join(info.assignments, assign)
                .join(assign.classroom, classroom)
                .where(classroom.year.eq(year)
                        .and(classroom.grade.eq(grade))
                        .and(classroom.classNum.eq(classNum)))
                .fetchOne();
        return count != null ? count : 0L;
    }

    @Override
    public long countByStatus(StudentStatus status) {
        QStudentInfo info = QStudentInfo.studentInfo;
        Long count = query.select(info.count())
                .from(info)
                .where(info.status.eq(status))
                .fetchOne();
        return count != null ? count : 0L;
    }

    @Override
    public int findMaxAttendanceNum(int year, int grade, int classNum) {
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom classroom = QClassroom.classroom;

        Integer max = query.select(assign.attendanceNum.max())
                .from(assign)
                .join(assign.classroom, classroom)
                .where(classroom.year.eq(year)
                        .and(classroom.grade.eq(grade))
                        .and(classroom.classNum.eq(classNum)))
                .fetchOne();
        return max != null ? max : 0;
    }
}
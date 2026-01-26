package com.example.schoolmate.common.repository.handler;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Component;
import com.example.schoolmate.common.dto.StudentDTO;
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

@Component
@RequiredArgsConstructor
public class StudentQueryHandler {
    private final JPAQueryFactory query;

    public Page<User> search(StudentDTO.StudentSearchCondition cond, Pageable pageable) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;

        JPAQuery<User> contentQuery = query
                .selectFrom(user)
                .leftJoin(info).on(info.user.eq(user)) // StudentInfo와 직접 조인
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
                .select(user.count())
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

    public Optional<User> findDetailByCode(String code) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;

        // StudentInfo를 기준으로 조회하여 User와 하위 정보를 한 번에 Fetch Join
        StudentInfo result = query
                .selectFrom(info)
                .innerJoin(info.user, user).fetchJoin() // User Fetch Join
                // 학적 이력 조인 (최신순 정렬을 위해 fetchJoin 유지)
                .leftJoin(info.assignments, assign).fetchJoin()
                .where(
                        info.code.eq(code),
                        user.roles.contains(UserRole.STUDENT))
                .fetchOne();

        return Optional.ofNullable(result).map(StudentInfo::getUser);
    }

    /**
     * 고유 학번 중복 여부 확인
     */
    public boolean existsByCode(String code) {
        QStudentInfo info = QStudentInfo.studentInfo;
        Integer fetchOne = query
                .selectOne()
                .from(info)
                .where(info.code.eq(code))
                .fetchFirst(); // findAny와 같은 역할 (성능 최적화)

        return fetchOne != null;
    }

    public List<User> findStudentsByAssignment(int year, int grade, int classNum) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;

        return query.selectFrom(user)
                .join(info).on(info.user.eq(user))
                .join(info.assignments, assign)
                .where(assign.schoolYear.eq(year)
                        .and(assign.grade.eq(grade))
                        .and(assign.classNum.eq(classNum)))
                .fetch();
    }

    /**
     * 해당 학년도에 배정되지 않은 재학생 조회 (랜덤 배정용)
     */
    public List<User> findUnassignedStudents(int year, int limit) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;

        // 해당 학년도에 배정 이력이 없는 학생 조회
        List<User> candidates = query.selectFrom(user)
                .join(info).on(info.user.eq(user))
                .where(
                        user.roles.contains(UserRole.STUDENT),
                        info.status.eq(StudentStatus.ENROLLED),
                        query.selectOne().from(assign)
                                .where(assign.studentInfo.eq(info).and(assign.schoolYear.eq(year)))
                                .notExists())
                .fetch();

        Collections.shuffle(candidates); // 랜덤 섞기
        return candidates.stream().limit(limit).toList();
    }

    public long countByClassroom(int year, int grade, int classNum) {
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;

        Long count = query.select(info.count())
                .from(info)
                .join(info.assignments, assign)
                .where(assign.schoolYear.eq(year)
                        .and(assign.grade.eq(grade))
                        .and(assign.classNum.eq(classNum)))
                .fetchOne();
        return count != null ? count : 0L;
    }

    public long countByStatus(StudentStatus status) {
        QStudentInfo info = QStudentInfo.studentInfo;
        Long count = query.select(info.count())
                .from(info)
                .where(info.status.eq(status))
                .fetchOne();
        return count != null ? count : 0L;
    }
}
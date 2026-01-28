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
import com.example.schoolmate.common.entity.QClassroom;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
import com.example.schoolmate.common.entity.user.QUser;
import com.example.schoolmate.common.entity.user.User;
import com.example.schoolmate.common.entity.user.constant.UserRole;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

/**
 * 학생 관련 복잡한 동적 쿼리를 처리하는 QueryDSL 핸들러
 *
 * JPA Repository의 기본 메서드로 처리하기 어려운
 * 동적 검색 조건, 페이징, 다중 조인 등의 복잡한 쿼리를 담당함.
 *
 * QueryDSL을 사용하여 타입 안전한 쿼리를 작성하며,
 * 런타임 시점에 조건에 따라 동적으로 WHERE 절을 구성함.
 */
@Component
@RequiredArgsConstructor
public class StudentQueryHandler {

    // QueryDSL의 핵심 클래스. JPQL 쿼리를 자바 코드로 작성 가능하게 함
    private final JPAQueryFactory query;

    public Page<User> search(StudentDTO.StudentSearchCondition cond, Pageable pageable) {
        // QueryDSL의 Q클래스 인스턴스 - 컴파일 타임에 생성된 메타모델
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;

        JPAQuery<User> contentQuery = query.selectFrom(user).distinct()
                .leftJoin(info).on(info.user.eq(user)) // StudentInfo와 직접 조인
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

    /**
     *
     * 
     * 검색 타입(type)에 따라 다른 필드에서 키워드를 검색함.
     * BooleanExpression을 반환하여 where절에 동적으로 추가됨.
     */
    private BooleanExpression searchPredicate(String type, String keyword, QUser user, QStudentInfo info) {
        if (keyword == null || keyword.isEmpty())
            return null; // 키워드 없으면 조건 무시
        return switch (type) {
            case "name" -> user.name.contains(keyword);
            case "email" -> user.email.contains(keyword);
            case "idNum" -> info.code.contains(keyword);
            default -> null;
        };
    }

    /**
     * 고유학번으로 학생 상세 정보 조회 (연관 데이터 전부 로딩)
     *
     * 학생 상세 페이지에서 필요한 모든 연관 데이터를 한 번의 쿼리로 가져옴.
     * fetchJoin을 사용하여 N+1 문제를 방지함.
     *
     * @param code 고유학번 (예: 20250001)
     * @return 학생 User 엔티티 (학적이력, 보호자 정보 포함)
     */
    public Optional<User> findDetailByCode(String code) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom classroom = QClassroom.classroom;

        // StudentInfo를 기준으로 조회하여 User와 하위 정보를 한 번에 Fetch Join
        StudentInfo result = query
                .selectFrom(info)
                .innerJoin(info.user, user).fetchJoin() // User Fetch Join
                // 학적 이력 조인 (최신순 정렬을 위해 fetchJoin 유지)
                .leftJoin(info.assignments, assign).fetchJoin()
                .leftJoin(assign.classroom, classroom).fetchJoin() // Classroom 정보도 함께 로딩
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

    public long countByStatus(StudentStatus status) {
        QStudentInfo info = QStudentInfo.studentInfo;
        Long count = query.select(info.count())
                .from(info)
                .where(info.status.eq(status))
                .fetchOne();
        return count != null ? count : 0L;
    }

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
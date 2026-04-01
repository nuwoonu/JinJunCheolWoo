package com.example.schoolmate.common.repository.info.student;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.Classroom;
import com.example.schoolmate.common.entity.QClassroom;
import com.example.schoolmate.common.entity.info.QFamilyRelation;
import com.example.schoolmate.common.entity.info.QStudentInfo;
import com.example.schoolmate.common.entity.info.StudentInfo;
import com.example.schoolmate.common.entity.info.assignment.QStudentAssignment;
import com.example.schoolmate.common.entity.info.constant.StudentStatus;
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
public class StudentInfoRepositoryImpl implements StudentInfoRepositoryCustom {

    private final JPAQueryFactory query;

    // ── 검색/페이징 ─────────────────────────────────────────────────────────────

    @Override
    public Page<User> search(StudentDTO.StudentSearchCondition cond, Pageable pageable) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QRoleRequest roleRequest = QRoleRequest.roleRequest; // [soojin] 대시보드 대기 목록 필터링용

        BooleanExpression schoolPredicate = cond.isIgnoreSchoolFilter() ? null : schoolFilter(info);
        BooleanExpression excludeLinkedPredicate = excludeLinkedFilter(info, cond.getExcludeParentId());

        JPAQuery<User> contentQuery = query.selectFrom(user)
                .leftJoin(info).on(info.user.eq(user))
                .leftJoin(info.currentAssignment, QStudentAssignment.studentAssignment)
                .leftJoin(QStudentAssignment.studentAssignment.classroom, QClassroom.classroom)
                .leftJoin(roleRequest).on(roleRequest.user.eq(user).and(roleRequest.role.eq(UserRole.STUDENT))) // [soojin] roleRequest 조인
                .where(
                        user.roles.contains(UserRole.STUDENT),
                        searchPredicate(cond.getType(), cond.getKeyword(), user, info),
                        statusFilter(cond.getStatus(), info),
                        schoolPredicate,
                        excludeLinkedPredicate,
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
                .leftJoin(roleRequest).on(roleRequest.user.eq(user).and(roleRequest.role.eq(UserRole.STUDENT))) // [soojin]
                .where(
                        user.roles.contains(UserRole.STUDENT),
                        searchPredicate(cond.getType(), cond.getKeyword(), user, info),
                        statusFilter(cond.getStatus(), info),
                        schoolPredicate,
                        excludeLinkedPredicate,
                        roleRequestStatusFilter(cond.getRoleRequestStatus(), roleRequest)); // [soojin]

        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    // ── 상세 조회 / 존재 여부 ────────────────────────────────────────────────────

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
                        user.roles.contains(UserRole.STUDENT),
                        schoolFilter(info))
                .fetchOne();

        return Optional.ofNullable(result).map(StudentInfo::getUser);
    }

    @Override
    public boolean existsByCode(String code) {
        QStudentInfo info = QStudentInfo.studentInfo;
        Integer fetchOne = query
                .selectOne()
                .from(info)
                .where(info.code.eq(code), schoolFilter(info))
                .fetchFirst();
        return fetchOne != null;
    }

    // ── User 기반 특정 조회 ───────────────────────────────────────────────────────

    @Override
    public Optional<StudentInfo> findByAttendanceNum(Integer attendanceNum) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        StudentInfo result = query
                .selectFrom(s)
                .join(s.currentAssignment, assign)
                .where(assign.attendanceNum.eq(attendanceNum))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    @Override
    public Optional<StudentInfo> findByUserEmail(String email) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QUser u = QUser.user;
        StudentInfo result = query
                .selectFrom(s)
                .join(s.user, u)
                .where(u.email.eq(email))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    @Override
    public Optional<StudentInfo> findByUserUid(Long uid) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QUser u = QUser.user;
        StudentInfo result = query
                .selectFrom(s)
                .join(s.user, u)
                .where(u.uid.eq(uid))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    // ── 학급 기반 조회 ────────────────────────────────────────────────────────────

    @Override
    public List<StudentInfo> findByClassroom(Classroom classroom) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        return query
                .selectFrom(s)
                .join(s.currentAssignment, assign)
                .where(assign.classroom.eq(classroom))
                .fetch();
    }

    @Override
    public List<StudentInfo> findByClassroomGrade(int grade) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom c = QClassroom.classroom;
        return query
                .selectFrom(s)
                .join(s.currentAssignment, assign)
                .join(assign.classroom, c)
                .where(c.grade.eq(grade))
                .fetch();
    }

    @Override
    public List<StudentInfo> findByClassroomClassNum(int classNum) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom c = QClassroom.classroom;
        return query
                .selectFrom(s)
                .join(s.currentAssignment, assign)
                .join(assign.classroom, c)
                .where(c.classNum.eq(classNum))
                .fetch();
    }

    @Override
    public List<StudentInfo> findByClassroomGradeAndClassroomClassNum(int grade, int classNum) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom c = QClassroom.classroom;
        return query
                .selectFrom(s)
                .join(s.currentAssignment, assign)
                .join(assign.classroom, c)
                .where(c.grade.eq(grade).and(c.classNum.eq(classNum)))
                .fetch();
    }

    @Override
    public List<StudentInfo> findByClassroomCid(Long classroomId) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom c = QClassroom.classroom;
        return query
                .selectFrom(s)
                .join(s.currentAssignment, assign)
                .join(assign.classroom, c)
                .where(c.cid.eq(classroomId))
                .fetch();
    }

    @Override
    public List<StudentInfo> findByClassroomYearAndClassroomGradeAndClassroomClassNum(int year, int grade,
            int classNum) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom c = QClassroom.classroom;
        return query
                .selectFrom(s)
                .join(s.currentAssignment, assign)
                .join(assign.classroom, c)
                .where(c.year.eq(year).and(c.grade.eq(grade)).and(c.classNum.eq(classNum)))
                .fetch();
    }

    // ── 학교 + 배정 상태 기반 조회 ────────────────────────────────────────────────

    @Override
    public List<StudentInfo> findUnassignedBySchoolId(Long schoolId) {
        QStudentInfo s = QStudentInfo.studentInfo;
        QUser u = QUser.user;
        return query
                .selectFrom(s)
                .join(s.user, u).fetchJoin()
                .where(s.school.id.eq(schoolId)
                        .and(s.currentAssignment.isNull()))
                .orderBy(s.id.desc())
                .fetch();
    }

    // ── 통계 ─────────────────────────────────────────────────────────────────────

    @Override
    public List<User> findStudentsByAssignment(int year, int grade, int classNum) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom classroom = QClassroom.classroom;

        // [woo] distinct 추가 — collection join 중복 방지
        return query.selectFrom(user).distinct()
                .join(info).on(info.user.eq(user))
                .join(info.assignments, assign)
                .join(assign.classroom, classroom)
                .where(classroom.year.eq(year)
                        .and(classroom.grade.eq(grade))
                        .and(classroom.classNum.eq(classNum)),
                        schoolFilter(info))
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
                        schoolFilter(info),
                        query.selectOne().from(assign)
                                .where(assign.studentInfo.eq(info).and(assign.schoolYear.eq(year)))
                                .notExists())
                .fetch();

        Collections.shuffle(candidates);
        return candidates.stream().limit(limit).toList();
    }

    // [woo] countDistinct + schoolFilter 적용 — 교사 등 비학생 중복 카운트 방지
    @Override
    public long countByClassroom(int year, int grade, int classNum) {
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QClassroom classroom = QClassroom.classroom;

        Long count = query.select(info.countDistinct())
                .from(info)
                .join(info.assignments, assign)
                .join(assign.classroom, classroom)
                .where(classroom.year.eq(year)
                        .and(classroom.grade.eq(grade))
                        .and(classroom.classNum.eq(classNum)),
                        schoolFilter(info))
                .fetchOne();
        return count != null ? count : 0L;
    }

    @Override
    public long countByStatus(StudentStatus status) {
        QStudentInfo info = QStudentInfo.studentInfo;
        Long count = query.select(info.count())
                .from(info)
                .where(info.status.eq(status), SchoolQueryFilter.schoolIdEq(info.school.id))
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

    // ── 공통 필터 ─────────────────────────────────────────────────────────────────

    private BooleanExpression schoolFilter(QStudentInfo info) {
        return SchoolQueryFilter.schoolIdEq(info.school.id);
    }

    private BooleanExpression excludeLinkedFilter(QStudentInfo info, Long parentId) {
        if (parentId == null)
            return null;
        QFamilyRelation fr = QFamilyRelation.familyRelation;
        return query.selectOne()
                .from(fr)
                .where(fr.studentInfo.eq(info).and(fr.parentInfo.id.eq(parentId)))
                .notExists();
    }

    private BooleanExpression statusFilter(String status, QStudentInfo info) {
        if (status == null || status.isEmpty())
            return null;
        return info.status.eq(StudentStatus.valueOf(status));
    }

    private BooleanExpression roleRequestStatusFilter(String status, QRoleRequest roleRequest) { // [soojin] 대시보드 대기 목록 필터링용
        if (status == null || status.isEmpty())
            return null;
        return roleRequest.status.eq(RoleRequestStatus.valueOf(status));
    }

    private BooleanExpression searchPredicate(String type, String keyword, QUser user, QStudentInfo info) {
        if (keyword == null || keyword.isEmpty())
            return null;
        if (type == null || type.isEmpty())
            return user.name.contains(keyword).or(info.code.contains(keyword));
        return switch (type) {
            case "name" -> user.name.contains(keyword);
            case "email" -> user.email.contains(keyword);
            case "idNum" -> info.code.contains(keyword);
            default -> user.name.contains(keyword).or(info.code.contains(keyword));
        };
    }
}

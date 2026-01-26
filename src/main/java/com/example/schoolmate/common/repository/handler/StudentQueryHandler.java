package com.example.schoolmate.common.repository.handler;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Component;
import com.example.schoolmate.common.dto.StudentDTO;
import com.example.schoolmate.common.entity.info.QFamilyRelation;
import com.example.schoolmate.common.entity.info.QParentInfo;
import com.example.schoolmate.common.entity.info.QStudentInfo;
import com.example.schoolmate.common.entity.info.assignment.QStudentAssignment;
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

    /**
     * 학생 목록 검색 (페이징 지원)
     *
     * @param cond     검색 조건 (이름, 이메일, 학번 등의 검색 타입 및 키워드 포함)
     * @param pageable 페이징 정보 (페이지 번호, 사이즈, 정렬)
     * @return 조건에 맞는 학생 User 엔티티 Page 객체
     */
    public Page<User> search(StudentDTO.StudentSearchCondition cond, Pageable pageable) {
        // QueryDSL의 Q클래스 인스턴스 - 컴파일 타임에 생성된 메타모델
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;

        // 실제 데이터 조회 쿼리
        List<User> content = query
                .selectFrom(user)
                // BaseInfo를 상속받은 StudentInfo와 조인 (JOINED 전략이므로 _super 사용)
                .leftJoin(user.infos, info._super)
                .where(
                        // 학생 권한을 가진 유저만 필터링
                        user.roles.contains(UserRole.STUDENT),
                        // 동적 검색 조건 (이름/이메일/학번)
                        searchPredicate(cond.getType(), cond.getKeyword(), user, info),
                        // 비활성 학생(졸업/퇴학 등) 필터링
                        inactiveFilter(cond.isIncludeInactive(), info))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .orderBy(user.uid.desc())
                .fetch();

        // 페이징을 위한 전체 카운트 쿼리 (지연 실행으로 성능 최적화)
        JPAQuery<Long> countQuery = query
                .select(user.count())
                .from(user)
                .leftJoin(user.infos, info._super)
                .where(
                        user.roles.contains(UserRole.STUDENT),
                        searchPredicate(cond.getType(), cond.getKeyword(), user, info),
                        inactiveFilter(cond.isIncludeInactive(), info));

        // PageableExecutionUtils: 데이터가 페이지 사이즈보다 적으면 count 쿼리를 실행하지 않음
        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    /**
     * 비활성 학생 필터링 조건 생성
     *
     * includeInactive가 false면 재학/휴학 상태만 조회함.
     * null을 반환하면 QueryDSL의 where절에서 해당 조건이 무시됨.
     */
    private BooleanExpression inactiveFilter(boolean includeInactive, QStudentInfo info) {
        if (includeInactive)
            return null; // 모든 상태 포함
        // 재학(ENROLLED), 휴학(LEAVE_OF_ABSENCE) 상태만 기본 노출
        // StudentInfo가 없는 경우(isNull)도 포함 (신규 등록 등)
        return info.status.in(StudentStatus.ENROLLED, StudentStatus.LEAVE_OF_ABSENCE).or(info.status.isNull());
    }

    /**
     * 동적 검색 조건 생성
     *
     * 검색 타입(type)에 따라 다른 필드에서 키워드를 검색함.
     * BooleanExpression을 반환하여 where절에 동적으로 추가됨.
     */
    private BooleanExpression searchPredicate(String type, String keyword, QUser user, QStudentInfo info) {
        if (keyword == null || keyword.isEmpty())
            return null; // 키워드 없으면 조건 무시
        return switch (type) {
            case "name" -> user.name.contains(keyword);   // 이름으로 검색
            case "email" -> user.email.contains(keyword); // 이메일로 검색
            case "idNum" -> info.studentIdentityNum.contains(keyword); // 고유학번으로 검색
            default -> null;
        };
    }

    /**
     * 고유학번으로 학생 상세 정보 조회 (연관 데이터 전부 로딩)
     *
     * 학생 상세 페이지에서 필요한 모든 연관 데이터를 한 번의 쿼리로 가져옴.
     * fetchJoin을 사용하여 N+1 문제를 방지함.
     *
     * @param identityNum 고유학번 (예: 20250001)
     * @return 학생 User 엔티티 (학적이력, 보호자 정보 포함)
     */
    public Optional<User> findDetailByIdentityNum(String identityNum) {
        QUser user = QUser.user;
        QStudentInfo info = QStudentInfo.studentInfo;
        QStudentAssignment assign = QStudentAssignment.studentAssignment;
        QFamilyRelation relation = QFamilyRelation.familyRelation;
        QParentInfo parent = QParentInfo.parentInfo;

        User result = query
                .selectFrom(user)
                // StudentInfo와 innerJoin: 학생 정보가 없는 유저는 제외
                // fetchJoin: 지연로딩 대신 즉시 로딩하여 N+1 문제 방지
                .innerJoin(user.infos, info._super).fetchJoin()
                // 학적 이력(연도별 학급 배정 정보) 조인
                .leftJoin(info.assignments, assign).fetchJoin()
                // 보호자 관계 테이블과 보호자 정보 조인
                .leftJoin(info.familyRelations, relation).fetchJoin()
                .leftJoin(relation.parentInfo, parent).fetchJoin()
                .where(
                        info.studentIdentityNum.eq(identityNum),
                        user.roles.contains(UserRole.STUDENT))
                .fetchOne(); // 단일 결과 조회 (없으면 null)

        return Optional.ofNullable(result);
    }

    /**
     * 고유학번 중복 여부 확인
     *
     * 신규 학생 등록 또는 학번 수정 시 중복 체크에 사용함.
     * selectOne + fetchFirst 조합으로 존재 여부만 빠르게 확인함.
     *
     * @param identityNum 확인할 고유학번
     * @return 이미 존재하면 true, 없으면 false
     */
    public boolean existsByIdentityNum(String identityNum) {
        QStudentInfo info = QStudentInfo.studentInfo;
        // selectOne: SELECT 1로 변환되어 불필요한 데이터 로딩 방지
        Integer fetchOne = query
                .selectOne()
                .from(info)
                .where(info.studentIdentityNum.eq(identityNum))
                .fetchFirst(); // limit 1과 동일. 첫 번째 결과만 가져옴

        return fetchOne != null;
    }
}
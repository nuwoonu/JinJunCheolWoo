package com.example.schoolmate.domain.board.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.config.school.SchoolQueryFilter;
import com.example.schoolmate.domain.board.entity.Board;
import com.example.schoolmate.domain.board.entity.BoardType;
import com.example.schoolmate.domain.board.entity.QBoard;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class BoardRepositoryImpl implements BoardRepositoryCustom {

    private final JPAQueryFactory query;

    @Override
    public Page<Board> findByType(BoardType type, String keyword, Pageable pageable) {
        QBoard board = QBoard.board;

        BooleanExpression where = board.boardType.eq(type)
                .and(board.isDeleted.isFalse())
                .and(schoolFilter(board))
                .and(keywordFilter(board, keyword));

        JPAQuery<Board> contentQuery = query.selectFrom(board).where(where);

        // 학교 공지는 중요 공지 우선, 나머지 게시판은 상단 고정 우선
        if (type == BoardType.SCHOOL_NOTICE) {
            contentQuery.orderBy(board.isImportant.desc(), board.id.desc());
        } else {
            contentQuery.orderBy(board.isPinned.desc(), board.createDate.desc());
        }

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        JPAQuery<Long> countQuery = query.select(board.count()).from(board).where(where);
        return PageableExecutionUtils.getPage(contentQuery.fetch(), pageable, countQuery::fetchOne);
    }

    @Override
    public Page<Board> findByTypeAndGrade(BoardType type, int grade, Pageable pageable) {
        QBoard board = QBoard.board;

        BooleanExpression where = board.boardType.eq(type)
                .and(board.targetGrade.eq(grade))
                .and(board.isDeleted.isFalse())
                .and(schoolFilter(board));

        JPAQuery<Board> contentQuery = query.selectFrom(board)
                .where(where)
                .orderBy(board.isPinned.desc(), board.createDate.desc());

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        JPAQuery<Long> countQuery = query.select(board.count()).from(board).where(where);
        return PageableExecutionUtils.getPage(contentQuery.fetch(), pageable, countQuery::fetchOne);
    }

    @Override
    // [soojin] keyword, searchType 파라미터 추가 - 전체/제목/내용/작성자 필터 검색 지원
    // [soojin] Pageable sort 반영 - viewCount/createDate 동적 정렬 지원 (최신순/조회순/인기순)
    public Page<Board> findByTypeAndClassroom(BoardType type, Long classroomId, String keyword, String searchType, Pageable pageable) {
        QBoard board = QBoard.board;

        BooleanExpression where = board.boardType.eq(type)
                .and(board.targetClassroom.cid.eq(classroomId))
                .and(board.isDeleted.isFalse())
                .and(schoolFilter(board))
                .and(keywordFilterByType(board, keyword, searchType));

        com.querydsl.core.types.OrderSpecifier<?> dynamicSort = board.createDate.desc();
        if (pageable.getSort().isSorted()) {
            String prop = pageable.getSort().iterator().next().getProperty();
            if ("viewCount".equals(prop)) {
                dynamicSort = board.viewCount.desc();
            }
        }

        JPAQuery<Board> contentQuery = query.selectFrom(board)
                .where(where)
                .orderBy(board.isPinned.desc(), dynamicSort);

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        JPAQuery<Long> countQuery = query.select(board.count()).from(board).where(where);
        return PageableExecutionUtils.getPage(contentQuery.fetch(), pageable, countQuery::fetchOne);
    }

    @Override
    public Page<Board> findParentByGrade(BoardType type, int grade, Pageable pageable) {
        QBoard board = QBoard.board;

        BooleanExpression where = board.boardType.eq(type)
                .and(board.targetGrade.eq(grade).or(board.targetGrade.isNull()))
                .and(board.targetClassroom.isNull())
                .and(board.isDeleted.isFalse())
                .and(schoolFilter(board));

        JPAQuery<Board> contentQuery = query.selectFrom(board)
                .where(where)
                .orderBy(board.isPinned.desc(), board.createDate.desc());

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        JPAQuery<Long> countQuery = query.select(board.count()).from(board).where(where);
        return PageableExecutionUtils.getPage(contentQuery.fetch(), pageable, countQuery::fetchOne);
    }

    @Override
    // [soojin] keyword 파라미터 추가 - 가정통신문 학부모 뷰 제목 검색 지원
    public Page<Board> findParentByClassroom(BoardType type, Long classroomId, int grade, String keyword, Pageable pageable) {
        QBoard board = QBoard.board;

        // 해당 학급 게시물 OR 해당 학년 전체 게시물 OR 전체 공지
        BooleanExpression targetFilter = board.targetClassroom.cid.eq(classroomId)
                .or(board.targetGrade.eq(grade).and(board.targetClassroom.isNull()))
                .or(board.targetGrade.isNull().and(board.targetClassroom.isNull()));

        BooleanExpression where = board.boardType.eq(type)
                .and(board.isDeleted.isFalse())
                .and(schoolFilter(board))
                .and(targetFilter)
                .and(keywordFilter(board, keyword));

        JPAQuery<Board> contentQuery = query.selectFrom(board)
                .where(where)
                .orderBy(board.isPinned.desc(), board.createDate.desc());

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        JPAQuery<Long> countQuery = query.select(board.count()).from(board).where(where);
        return PageableExecutionUtils.getPage(contentQuery.fetch(), pageable, countQuery::fetchOne);
    }

    @Override
    public List<Board> findRecentByType(BoardType type, int limit) {
        QBoard board = QBoard.board;
        return query.selectFrom(board)
                .where(board.boardType.eq(type)
                        .and(board.isDeleted.isFalse())
                        .and(schoolFilter(board)))
                .orderBy(board.createDate.desc())
                .limit(limit)
                .fetch();
    }

    // [soojin] 인기글 조회 - 조회수 기준 상위 N개 (학급 게시판 사이드바용)
    @Override
    public List<Board> findTopByViewCount(BoardType boardType, int limit) {
        QBoard board = QBoard.board;
        return query.selectFrom(board)
                .where(board.boardType.eq(boardType)
                        .and(board.isDeleted.isFalse())
                        .and(schoolFilter(board)))
                .orderBy(board.viewCount.desc())
                .limit(limit)
                .fetch();
    }

    // [soojin] 게시판 통계 - 전체 게시글 수 (사이드바 통계 카드용)
    @Override
    public long countByType(BoardType boardType) {
        QBoard board = QBoard.board;
        Long count = query.select(board.count()).from(board)
                .where(board.boardType.eq(boardType)
                        .and(board.isDeleted.isFalse())
                        .and(schoolFilter(board)))
                .fetchOne();
        return count != null ? count : 0L;
    }

    // [soojin] 게시판 통계 - 전체 조회수 합계 (사이드바 통계 카드용)
    @Override
    public long sumViewCountByType(BoardType boardType) {
        QBoard board = QBoard.board;
        Integer sum = query.select(board.viewCount.sum()).from(board)
                .where(board.boardType.eq(boardType)
                        .and(board.isDeleted.isFalse())
                        .and(schoolFilter(board)))
                .fetchOne();
        return sum != null ? sum.longValue() : 0L;
    }

    // [soojin] 오늘 작성된 게시글 수 - 게시판 통계 카드 "오늘 작성" 항목용
    @Override
    public long countTodayByType(BoardType boardType) {
        QBoard board = QBoard.board;
        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        Long count = query.select(board.count()).from(board)
                .where(board.boardType.eq(boardType)
                        .and(board.isDeleted.isFalse())
                        .and(schoolFilter(board))
                        .and(board.createDate.goe(startOfDay)))
                .fetchOne();
        return count != null ? count : 0L;
    }

    private BooleanExpression schoolFilter(QBoard board) {
        return SchoolQueryFilter.schoolIdEq(board.school.id);
    }

    private BooleanExpression keywordFilter(QBoard board, String keyword) {
        if (keyword == null || keyword.isBlank())
            return null;
        return board.title.contains(keyword).or(board.content.contains(keyword));
    }

    // [soojin] searchType별 키워드 필터 - 전체/제목/내용/작성자 구분 검색용
    private BooleanExpression keywordFilterByType(QBoard board, String keyword, String searchType) {
        if (keyword == null || keyword.isBlank()) return null;
        if ("TITLE".equals(searchType))   return board.title.contains(keyword);
        if ("CONTENT".equals(searchType)) return board.content.contains(keyword);
        if ("WRITER".equals(searchType))  return board.writer.name.contains(keyword);
        // ALL 또는 null → 제목 + 내용 검색 (기존 동작 유지)
        return board.title.contains(keyword).or(board.content.contains(keyword));
    }
}

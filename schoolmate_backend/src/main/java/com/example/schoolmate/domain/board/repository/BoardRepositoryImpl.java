package com.example.schoolmate.domain.board.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.config.school.SchoolContextHolder;
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
    public Page<Board> findByTypeAndClassroom(BoardType type, Long classroomId, Pageable pageable) {
        QBoard board = QBoard.board;

        BooleanExpression where = board.boardType.eq(type)
                .and(board.targetClassroom.cid.eq(classroomId))
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
    public Page<Board> findParentByClassroom(BoardType type, Long classroomId, int grade, Pageable pageable) {
        QBoard board = QBoard.board;

        // 해당 학급 게시물 OR 해당 학년 전체 게시물 OR 전체 공지
        BooleanExpression targetFilter = board.targetClassroom.cid.eq(classroomId)
                .or(board.targetGrade.eq(grade).and(board.targetClassroom.isNull()))
                .or(board.targetGrade.isNull().and(board.targetClassroom.isNull()));

        BooleanExpression where = board.boardType.eq(type)
                .and(board.isDeleted.isFalse())
                .and(schoolFilter(board))
                .and(targetFilter);

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

    private BooleanExpression schoolFilter(QBoard board) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null)
            return null;
        return board.school.id.eq(schoolId);
    }

    private BooleanExpression keywordFilter(QBoard board, String keyword) {
        if (keyword == null || keyword.isBlank())
            return null;
        return board.title.contains(keyword).or(board.content.contains(keyword));
    }
}

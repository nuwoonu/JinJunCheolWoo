package com.example.schoolmate.domain.resources.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import com.example.schoolmate.config.school.SchoolContextHolder;
import com.example.schoolmate.domain.resources.entity.QSchoolAsset;
import com.example.schoolmate.domain.resources.entity.SchoolAsset;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class SchoolAssetRepositoryImpl implements SchoolAssetRepositoryCustom {

    private final JPAQueryFactory query;

    @Override
    public Page<SchoolAsset> search(String keyword, Pageable pageable) {
        QSchoolAsset asset = QSchoolAsset.schoolAsset;

        BooleanExpression where = schoolFilter(asset).and(keywordFilter(asset, keyword));

        JPAQuery<SchoolAsset> contentQuery = query.selectFrom(asset)
                .where(where)
                .orderBy(asset.id.desc());

        if (pageable.isPaged()) {
            contentQuery.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        JPAQuery<Long> countQuery = query.select(asset.count()).from(asset).where(where);
        return PageableExecutionUtils.getPage(contentQuery.fetch(), pageable, countQuery::fetchOne);
    }

    @Override
    public List<SchoolAsset> findAllByCurrentSchool() {
        QSchoolAsset asset = QSchoolAsset.schoolAsset;
        return query.selectFrom(asset)
                .where(schoolFilter(asset))
                .fetch();
    }

    private BooleanExpression schoolFilter(QSchoolAsset asset) {
        Long schoolId = SchoolContextHolder.getSchoolId();
        if (schoolId == null) return null;
        return asset.school.id.eq(schoolId);
    }

    private BooleanExpression keywordFilter(QSchoolAsset asset, String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        return asset.name.contains(keyword).or(asset.assetCode.contains(keyword));
    }
}

package com.example.schoolmate.domain.resources.repository;

import java.util.List;

import com.example.schoolmate.config.school.SchoolQueryFilter;
import com.example.schoolmate.domain.resources.entity.QSchoolFacility;
import com.example.schoolmate.domain.resources.entity.SchoolFacility;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class SchoolFacilityRepositoryImpl implements SchoolFacilityRepositoryCustom {

    private final JPAQueryFactory query;

    @Override
    public List<SchoolFacility> findAllByCurrentSchool() {
        QSchoolFacility facility = QSchoolFacility.schoolFacility;
        return query.selectFrom(facility)
                .where(schoolFilter(facility))
                .orderBy(facility.name.asc())
                .fetch();
    }

    private BooleanExpression schoolFilter(QSchoolFacility facility) {
        return SchoolQueryFilter.schoolIdEq(facility.school.id);
    }
}

package com.example.schoolmate.domain.log.spec;

import com.example.schoolmate.domain.log.dto.LogSearchCondition;
import com.example.schoolmate.domain.log.entity.LogType;
import com.example.schoolmate.domain.log.entity.SchoolmateLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class LogSpecification {

    public static Specification<SchoolmateLog> search(LogType logType, LogSearchCondition condition) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("logType"), logType));

            if (condition.getKeyword() != null && !condition.getKeyword().isBlank()) {
                String likeKeyword = "%" + condition.getKeyword() + "%";
                List<Predicate> keywordOr = new ArrayList<>();
                keywordOr.add(cb.like(root.get("actorName"), likeKeyword));
                if (logType == LogType.ADMIN) {
                    keywordOr.add(cb.like(root.get("target"), likeKeyword));
                    keywordOr.add(cb.like(root.get("description"), likeKeyword));
                } else if (logType == LogType.ACCESS) {
                    keywordOr.add(cb.like(root.get("ipAddress"), likeKeyword));
                }
                predicates.add(cb.or(keywordOr.toArray(new Predicate[0])));
            }

            if (condition.getType() != null && !condition.getType().isBlank()) {
                if (logType == LogType.ADMIN) {
                    predicates.add(cb.equal(root.get("actionType"), condition.getType()));
                } else if (logType == LogType.ACCESS) {
                    predicates.add(cb.equal(root.get("accessType"), condition.getType()));
                }
            }

            if (condition.getStartDate() != null) {
                predicates
                        .add(cb.greaterThanOrEqualTo(root.get("createDate"), condition.getStartDate().atStartOfDay()));
            }
            if (condition.getEndDate() != null) {
                predicates.add(cb.lessThan(root.get("createDate"), condition.getEndDate().plusDays(1).atStartOfDay()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

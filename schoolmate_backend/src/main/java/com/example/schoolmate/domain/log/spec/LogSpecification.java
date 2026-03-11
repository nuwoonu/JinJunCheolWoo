package com.example.schoolmate.domain.log.spec;

import com.example.schoolmate.domain.log.dto.LogSearchCondition;
import com.example.schoolmate.domain.log.entity.AccessLog;
import com.example.schoolmate.domain.log.entity.AdminLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.List;

public class LogSpecification {

    public static Specification<AdminLog> searchAdminLogs(LogSearchCondition condition) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (condition.getKeyword() != null && !condition.getKeyword().isBlank()) {
                predicates.add(cb.or(
                        cb.like(root.get("adminName"), "%" + condition.getKeyword() + "%"),
                        cb.like(root.get("target"), "%" + condition.getKeyword() + "%"),
                        cb.like(root.get("description"), "%" + condition.getKeyword() + "%")));
            }
            if (condition.getType() != null && !condition.getType().isBlank()) {
                predicates.add(cb.equal(root.get("actionType"), condition.getType()));
            }
            if (condition.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), condition.getStartDate().atStartOfDay()));
            }
            if (condition.getEndDate() != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), condition.getEndDate().plusDays(1).atStartOfDay()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<AccessLog> searchAccessLogs(LogSearchCondition condition) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (condition.getKeyword() != null && !condition.getKeyword().isBlank()) {
                predicates.add(cb.or(
                        cb.like(root.get("username"), "%" + condition.getKeyword() + "%"),
                        cb.like(root.get("ipAddress"), "%" + condition.getKeyword() + "%")));
            }
            if (condition.getType() != null && !condition.getType().isBlank()) {
                try {
                    AccessLog.AccessType accessType = AccessLog.AccessType.valueOf(condition.getType());
                    predicates.add(cb.equal(root.get("type"), accessType));
                } catch (IllegalArgumentException e) {
                    // Ignore invalid type
                }
            }
            if (condition.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), condition.getStartDate().atStartOfDay()));
            }
            if (condition.getEndDate() != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), condition.getEndDate().plusDays(1).atStartOfDay()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
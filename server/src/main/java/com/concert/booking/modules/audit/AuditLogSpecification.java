package com.concert.booking.modules.audit;

import com.concert.booking.modules.audit.enums.AuditLogAction;
import com.concert.booking.modules.audit.enums.AuditLogStatus;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public class AuditLogSpecification {
  public static Specification<AuditLog> filter(
      String keyword, AuditLogStatus status, AuditLogAction action) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (keyword != null && !keyword.trim().isEmpty()) {
        String match = "%" + keyword.trim().toLowerCase() + "%";
        predicates.add(
            cb.or(
                cb.like(cb.lower(root.get("username")), match),
                cb.like(cb.lower(root.get("message")), match)));
      }

      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }

      if (action != null) {
        predicates.add(cb.equal(root.get("action"), action));
      }

      query.orderBy(cb.desc(root.get("createdAt")));

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }
}

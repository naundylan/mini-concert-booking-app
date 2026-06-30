package com.concert.booking.modules.audit;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository
    extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {}

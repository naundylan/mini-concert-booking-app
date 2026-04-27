package com.concert.booking.modules.audit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import com.concert.booking.modules.audit.enums.AuditLogAction;
import com.concert.booking.modules.audit.enums.AuditLogEntity;
import com.concert.booking.modules.audit.enums.AuditLogStatus;

@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_log_user_id", columnList = "user_id"),
        @Index(name = "idx_audit_log_action", columnList = "action"),
        @Index(name = "idx_audit_log_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuditLog {
    
    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    UUID id;

    @Column(name = "user_id")
    UUID userId; // Người thực hiện hành động (Có thể NULL nếu là khách chưa login hoặc tác vụ hệ thống)

    @Column(length = 100)
    String username; // Snapshot tên/username tại thời điểm đó

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    AuditLogAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_name", nullable = false, length = 100)
    AuditLogEntity entityName;

    @Column(name = "entity_id", length = 100)
    String entityId; // ID của đối tượng bị tác động (Lưu String để linh hoạt)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    AuditLogStatus status;

    @Column(columnDefinition = "text")
    String message; // Ghi chú chi tiết (VD: "Đăng nhập thất bại do sai mật khẩu")

    @Column(name = "ip_address", length = 45)
    String ipAddress;

    @Column(name = "user_agent", length = 500)
    String userAgent; // Trình duyệt/Thiết bị

    @Column(name = "metadata", columnDefinition = "text")
    String metadata; // Chứa JSON payload nếu cần log lại data cũ/mới để đối soát

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    Instant createdAt;
}

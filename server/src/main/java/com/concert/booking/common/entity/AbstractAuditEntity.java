package com.concert.booking.common.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PROTECTED)
public abstract class AbstractAuditEntity {

  @CreatedDate
  @Column(name = "created_at", updatable = false, nullable = false)
  Instant createdAt;

  @LastModifiedDate
  @Column(name = "updated_at", nullable = false)
  Instant updatedAt;

  @Column(name = "created_by")
  UUID createdBy;

  @Column(name = "updated_by")
  UUID updatedBy;
}

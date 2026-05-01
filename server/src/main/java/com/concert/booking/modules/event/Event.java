package com.concert.booking.modules.event;

import com.concert.booking.common.entity.AbstractAuditEntity;
import com.concert.booking.modules.event.enums.EventStatus;
import jakarta.persistence.*;
import java.sql.Timestamp;
import java.util.UUID;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Event extends AbstractAuditEntity {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    UUID id;

    @Column(nullable = false, length = 255)
    String name;

    @Column(nullable = false, length = 500)
    String location;

    @Column(name = "banner_url", length = 500)
    String bannerUrl;

    @Column(name = "teasing_time")
    Timestamp teasingTime;

    @Column(name = "open_time")
    Timestamp openTime;

    @Column(name = "start_time")
    Timestamp startTime;

    @Column(name = "end_time")
    Timestamp endTime;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    EventStatus status = EventStatus.DRAFT;

    @Version
    int version; // Hỗ trợ Optimistic Locking theo ERD
}
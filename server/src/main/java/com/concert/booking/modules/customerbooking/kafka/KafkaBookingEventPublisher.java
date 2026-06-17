package com.concert.booking.modules.customerbooking.kafka;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@ConditionalOnProperty(prefix = "application.kafka", name = "enabled", havingValue = "true")
public class KafkaBookingEventPublisher implements BookingEventPublisher {
  final KafkaTemplate<String, BookingPaidEvent> kafkaTemplate;

  @Value("${application.kafka.topics.bookingPaid}")
  String bookingPaidTopic;

  @Override
  public void publishBookingPaid(BookingPaidEvent event) {
    kafkaTemplate
        .send(bookingPaidTopic, event.orderId().toString(), event)
        .whenComplete(
            (result, ex) -> {
              if (ex != null) {
                log.error("Failed to publish booking paid event. orderId={}", event.orderId(), ex);
                return;
              }
              log.info(
                  "Published booking paid event. orderId={}, topic={}, offset={}",
                  event.orderId(),
                  result.getRecordMetadata().topic(),
                  result.getRecordMetadata().offset());
            });
  }
}

package com.concert.booking.config;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Slf4j
@Configuration
@ConditionalOnProperty(prefix = "application.kafka", name = "enabled", havingValue = "true")
public class KafkaConfig {
  @Bean
  public CommonErrorHandler errorHandler(KafkaTemplate<Object, Object> kafkaTemplate) {
    log.info("Registering Kafka DefaultErrorHandler with DeadLetterPublishingRecoverer (DLQ)");

    DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
        (record, exception) -> {
            log.error(
                "Sending to DLQ: key={}, topic={}, partition={}, offset={}",
                record.key(),
                record.topic(),
                record.partition(),
                record.offset(),
                exception);
            return new org.apache.kafka.common.TopicPartition(record.topic() + ".DLQ", record.partition());
        });

    FixedBackOff backOff = new FixedBackOff(2000L, 3L);
    DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);

    return errorHandler;
  }
}

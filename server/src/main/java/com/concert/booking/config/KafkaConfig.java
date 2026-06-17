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

    // Configure DLQ recoverer: sends failed messages to <original_topic>.DLQ
    DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate);

    // Retry 3 times, with a fixed backoff of 2 seconds (2000 milliseconds)
    FixedBackOff backOff = new FixedBackOff(2000L, 3L);

    DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);

    // Add logging when a recovery is triggered (i.e. message is sent to DLQ)
    errorHandler.setRecoveryFailedListener(
        (record, exception) ->
            log.error(
                "DLQ recovery failed for record key={}, topic={}, partition={}, offset={}",
                record.key(),
                record.topic(),
                record.partition(),
                record.offset(),
                exception));

    return errorHandler;
  }
}

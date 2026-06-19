package com.concert.booking.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Slf4j
@Configuration
@ConditionalOnProperty(prefix = "application.kafka", name = "enabled", havingValue = "true")
public class KafkaConfig {

  @Bean
  public ConcurrentKafkaListenerContainerFactory<Object, Object> kafkaListenerContainerFactory(
      ConsumerFactory<Object, Object> consumerFactory, CommonErrorHandler errorHandler) {
    log.info("Configuring ConcurrentKafkaListenerContainerFactory with AckMode.RECORD");
    ConcurrentKafkaListenerContainerFactory<Object, Object> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);
    factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.RECORD);
    factory.setCommonErrorHandler(errorHandler);
    return factory;
  }

  @Bean
  public CommonErrorHandler errorHandler(KafkaTemplate<Object, Object> kafkaTemplate) {
    log.info("Registering Kafka DefaultErrorHandler with DeadLetterPublishingRecoverer (DLQ)");

    // Configure DLQ recoverer: sends failed messages to <original_topic>.DLQ
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

    // Retry 3 times, with a fixed backoff of 2 seconds (2000 milliseconds)
    FixedBackOff backOff = new FixedBackOff(2000L, 3L);

    DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);

    // Add logging when a recovery fails
    errorHandler.setRetryListeners(
        new org.springframework.kafka.listener.RetryListener() {
          @Override
          public void failedDelivery(
              org.apache.kafka.clients.consumer.ConsumerRecord<?, ?> record,
              Exception exception,
              int deliveryAttempt) {
            // No-op
          }

          @Override
          public void recovered(
              org.apache.kafka.clients.consumer.ConsumerRecord<?, ?> record, Exception exception) {
            // No-op
          }

          @Override
          public void recoveryFailed(
              org.apache.kafka.clients.consumer.ConsumerRecord<?, ?> record,
              Exception original,
              Exception failure) {
            log.error(
                "DLQ recovery failed for record key={}, topic={}, partition={}, offset={}",
                record.key(),
                record.topic(),
                record.partition(),
                record.offset(),
                failure);
          }
        });

    return errorHandler;
  }
}

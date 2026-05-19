package com.concert.booking.modules.event;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EventStatusStartupSync implements ApplicationRunner {
  EventStatusTransitionService eventStatusTransitionService;

  @Override
  public void run(ApplicationArguments args) {
    eventStatusTransitionService.syncEventStatuses();
  }
}

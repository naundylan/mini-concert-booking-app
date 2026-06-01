package com.concert.booking.config;

import com.concert.booking.common.constants.SocketIoProperties;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SocketIoConfig {

  SocketIoProperties socketIoProperties;

  @Bean(destroyMethod = "stop")
  SocketIOServer socketIOServer() {
    com.corundumstudio.socketio.Configuration config =
        new com.corundumstudio.socketio.Configuration();
    config.setHostname(socketIoProperties.getHostname());
    config.setPort(socketIoProperties.getPort());
    config.setOrigin(socketIoProperties.getOrigin());
    config.setAllowCustomRequests(true);

    return new SocketIOServer(config);
  }

  @Bean
  ApplicationRunner socketIoServerRunner(SocketIOServer socketIOServer) {
    return args -> {
      socketIOServer.start();
      log.info(
          "Socket.IO server started at {}:{}",
          socketIoProperties.getHostname(),
          socketIoProperties.getPort());
    };
  }
}

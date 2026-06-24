package com.concert.booking;

import com.cloudinary.Cloudinary;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.core.type.AnnotatedTypeMetadata;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.junit.jupiter.api.BeforeEach;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(BaseIntegrationTest.OfflineMockConfig.class)
public abstract class BaseIntegrationTest {

  @Autowired protected MockMvc mockMvc;

  @MockBean protected Cloudinary cloudinary;
  @MockBean protected JavaMailSender javaMailSender;
  @MockBean protected SocketIOServer socketIOServer;
  @MockBean protected com.concert.booking.modules.customerbooking.socket.SeatHoldExpirationScheduler seatHoldExpirationScheduler;

  @BeforeEach
  void setUpSocketIOServerMock() {
    com.corundumstudio.socketio.BroadcastOperations mockBroadcast = mock(com.corundumstudio.socketio.BroadcastOperations.class);
    when(socketIOServer.getRoomOperations(anyString())).thenReturn(mockBroadcast);
    when(socketIOServer.getRoomOperations(any(String[].class))).thenReturn(mockBroadcast);
  }

  // Real beans connected to testcontainers (if Docker is running)
  @Autowired(required = false) protected StringRedisTemplate stringRedisTemplate;
  @Autowired(required = false) protected RedisTemplate<String, Object> redisTemplate;
  @Autowired(required = false) protected RedisConnectionFactory redisConnectionFactory;
  @Autowired(required = false) protected KafkaTemplate<String, Object> kafkaTemplate;

  // Detect if Docker is active
  public static final boolean DOCKER_AVAILABLE = checkDockerAvailable();

  // Define containers (do not start them unless Docker is running)
  static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
      .withUsername("postgres")
      .withPassword("password")
      .withDatabaseName("ticket_booking_db");
  static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.4.0"));
  static final GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7.0-alpine"))
      .withExposedPorts(6379);

  static {
    if (DOCKER_AVAILABLE) {
      postgres.start();
      kafka.start();
      redis.start();
    }
  }

  public static boolean isDockerAvailable() {
    return DOCKER_AVAILABLE;
  }

  private static boolean checkDockerAvailable() {
    try {
      return org.testcontainers.DockerClientFactory.instance().isDockerAvailable();
    } catch (Throwable e) {
      return false;
    }
  }

  @DynamicPropertySource
  static void configureProperties(DynamicPropertyRegistry registry) {
    if (DOCKER_AVAILABLE) {
      // Database connection (PostgreSQL Container)
      registry.add("spring.datasource.url", postgres::getJdbcUrl);
      registry.add("spring.datasource.username", postgres::getUsername);
      registry.add("spring.datasource.password", postgres::getPassword);

      // Kafka connection (Kafka Container)
      registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);

      // Redis connection (Redis Container)
      registry.add("spring.data.redis.host", redis::getHost);
      registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));

      // Enable Kafka
      registry.add("application.kafka.enabled", () -> "true");
    } else {
      // Graceful fallback to H2 Database for offline testing
      registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE");
      registry.add("spring.datasource.username", () -> "sa");
      registry.add("spring.datasource.password", () -> "password");
      registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
      registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.H2Dialect");
      registry.add("spring.flyway.enabled", () -> "false"); // Disable migrations on H2

      // Disable Kafka
      registry.add("application.kafka.enabled", () -> "false");

      // Dynamically exclude Redis and Kafka AutoConfigurations to prevent connection attempts
      registry.add("spring.autoconfigure.exclude", () ->
          "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration," +
          "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration," +
          "org.springframework.boot.autoconfigure.data.redis.RedisReactiveAutoConfiguration," +
          "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
      );
    }
  }

  @TestConfiguration
  @Conditional(BaseIntegrationTest.DockerOfflineCondition.class)
  public static class OfflineMockConfig {
    @Bean
    @ConditionalOnMissingBean(StringRedisTemplate.class)
    public StringRedisTemplate stringRedisTemplate() {
      return mock(StringRedisTemplate.class);
    }

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")
    @SuppressWarnings("unchecked")
    public RedisTemplate<String, Object> redisTemplate() {
      return mock(RedisTemplate.class);
    }

    @Bean
    @ConditionalOnMissingBean(RedisConnectionFactory.class)
    public RedisConnectionFactory redisConnectionFactory() {
      return mock(RedisConnectionFactory.class);
    }

    @Bean
    @ConditionalOnMissingBean(KafkaTemplate.class)
    @SuppressWarnings("rawtypes")
    public KafkaTemplate kafkaTemplate() {
      return mock(KafkaTemplate.class);
    }
  }

  public static class DockerOfflineCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
      return !BaseIntegrationTest.isDockerAvailable();
    }
  }
}

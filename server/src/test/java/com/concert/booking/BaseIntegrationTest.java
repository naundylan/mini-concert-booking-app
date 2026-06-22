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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

  @Autowired protected MockMvc mockMvc;

  @MockBean protected Cloudinary cloudinary;
  @MockBean protected JavaMailSender javaMailSender;
  @MockBean protected SocketIOServer socketIOServer;

  // Real beans connected to testcontainers (if Docker is running)
  @Autowired(required = false) protected StringRedisTemplate stringRedisTemplate;
  @Autowired(required = false) protected RedisTemplate<String, Object> redisTemplate;
  @Autowired(required = false) protected RedisConnectionFactory redisConnectionFactory;
  @Autowired(required = false) protected KafkaTemplate<String, Object> kafkaTemplate;

  // Detect if Docker is active
  public static final boolean DOCKER_AVAILABLE = checkDockerAvailable();

  // Define containers (do not start them unless Docker is running)
  static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");
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
    } else {
      // Graceful fallback to H2 Database for offline testing
      registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE");
      registry.add("spring.datasource.username", () -> "sa");
      registry.add("spring.datasource.password", () -> "password");
      registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
      registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.H2Dialect");
      registry.add("spring.flyway.enabled", () -> "false"); // Disable migrations on H2

      // Dynamically exclude Redis and Kafka AutoConfigurations to prevent connection attempts
      registry.add("spring.autoconfigure.exclude", () ->
          "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration," +
          "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration," +
          "org.springframework.boot.autoconfigure.data.redis.RedisReactiveAutoConfiguration," +
          "org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
      );
    }
  }
}

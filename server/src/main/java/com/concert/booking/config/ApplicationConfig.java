package com.concert.booking.config;

import com.cloudinary.Cloudinary;
import com.concert.booking.common.constants.CloudinaryProperties;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationConfig {

  CloudinaryProperties cloudinaryProperties;

  @Bean
  OpenAPI openAPI(@Value("${server.port:8080}") String serverPort) {
    return new OpenAPI()
        .servers(List.of(new Server().url("http://localhost:" + serverPort).description("Local")))
        .info(
            new Info()
                .title("Restful API server")
                .version("1.0.0")
                .contact(new Contact().name("Khanh Nguyen").email("knguyen1411b@gmail.com")))
        .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
        .components(
            new Components()
                .addSecuritySchemes(
                    "Bearer Authentication",
                    new SecurityScheme()
                        .name("Bearer Authentication")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
  }

  @Bean
  public Cloudinary cloudinary() {
    Map<String, String> config = new HashMap<>();
    config.put("cloud_name", cloudinaryProperties.getCloudName());
    config.put("api_key", cloudinaryProperties.getApiKey());
    config.put("api_secret", cloudinaryProperties.getApiSecret());
    return new Cloudinary(config);
  }

  @Bean
  ModelMapper modelMapper() {
    ModelMapper modelMapper = new ModelMapper();
    modelMapper.getConfiguration().setMatchingStrategy(MatchingStrategies.STANDARD);
    return modelMapper;
  }
}

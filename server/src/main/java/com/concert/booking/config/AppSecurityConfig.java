package com.concert.booking.config;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.concert.booking.common.exception.CustomAccessDeniedHandler;
import com.concert.booking.common.exception.CustomAuthenticationEntryPoint;
import com.concert.booking.modules.auth.AuthService;
import com.concert.booking.modules.auth.dto.OAuth2LoginDTO;
import com.concert.booking.modules.auth.filter.JwtAuthenticationFilter;
import com.concert.booking.modules.auth.security.JwtService;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class AppSecurityConfig {
  private final JwtService jwtService;
  private final CustomAccessDeniedHandler customAccessDeniedHandler;
  private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
  private final AuthService authService;

  public AppSecurityConfig(JwtService jwtService, CustomAccessDeniedHandler customAccessDeniedHandler, CustomAuthenticationEntryPoint customAuthenticationEntryPoint, @Lazy AuthService authService) {
    this.jwtService = jwtService;
    this.customAccessDeniedHandler = customAccessDeniedHandler;
    this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
    this.authService = authService;
  }

  static String[] SWAGGER_WHITELIST = {"/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"};
  static String[] PUBLIC_ENDPOINTS = {"/"};
  static String[] AUTH_ENDPOINTS = {
      "/api/v1/auth/**", // Cho phép tất cả login/register/refresh
      "/oauth2/**",      // OAuth2 endpoints (authorization, callback)
      "/login/**"        // OAuth2 login endpoints
  };

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
      http.csrf(csrf -> csrf.disable());
      http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
          .requestMatchers(SWAGGER_WHITELIST).permitAll()
          .requestMatchers(AUTH_ENDPOINTS).permitAll()
          .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
          .anyRequest().authenticated()
      )
      .exceptionHandling(ex -> ex
        .authenticationEntryPoint(customAuthenticationEntryPoint) // Trả về 401 khi chưa auth
        .accessDeniedHandler(customAccessDeniedHandler) // Trả về 403 khi đã auth nhưng không đủ quyền
      )
      // Đưa JWT vào để check token trước khi vào controller
      .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
      // 2. Cấu hình cho OAuth2
      .oauth2Login(oauth2 -> oauth2
        .successHandler((request, response, authentication) -> {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            
            // Gọi Service bạn vừa viết
            OAuth2LoginDTO loginData = authService.processOAuth2Customer(oAuth2User);

            // Tạo URL trả về Frontend (Frontend callback page tại /auth/callback)
            String frontendRedirectUrl = "http://localhost:3000/auth/callback";

            // Gắn dữ liệu vào URL để Frontend đọc
            String targetUrl = frontendRedirectUrl + 
                    "?email=" + loginData.getUserInfo().getEmail() +
                    "&fullName=" + URLEncoder.encode(loginData.getUserInfo().getFullName(), StandardCharsets.UTF_8) +
                    "&googleId=" + loginData.getUserInfo().getGoogleId() +
                    "&hasPhone=" + (loginData.getUserInfo().getPhone() != null);

            // Nếu có token (đã có SĐT), gắn thêm token vào
            if (loginData.getAccessToken() != null) {
                targetUrl += "&accessToken=" + loginData.getAccessToken();
                targetUrl += "&refreshToken=" + loginData.getRefreshToken();
            }

            response.sendRedirect(targetUrl);
        })
      );

      return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
      CorsConfiguration cors = new CorsConfiguration();
      cors.setAllowCredentials(true);
      // Cấu hình origin linh hoạt như dự án cũ của bạn
      cors.setAllowedOriginPatterns(List.of(
          "http://localhost:3000",
          "http://localhost:*",
          "https://*.app.github.dev"
      ));
      cors.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
      cors.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type"));
      cors.setExposedHeaders(List.of("Authorization"));

      UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
      source.registerCorsConfiguration("/**", cors);
      return source;
  }
}

package com.concert.booking.config;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;

import com.concert.booking.modules.auth.AuthService;
import com.concert.booking.modules.auth.dto.OAuth2LoginDTO;

@Configuration
@EnableWebSecurity
public class AppSecurityConfig {
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, @Lazy AuthService authService) throws Exception {
      http
          .csrf(csrf -> csrf.disable())
          .authorizeHttpRequests(auth -> auth
              // Cho phép tất cả các API liên quan đến Login/Register/Swagger
              .requestMatchers("/api/v1/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
              .anyRequest().authenticated()
          )
          // 1. Cấu hình cho Đăng nhập truyền thống (Form Login)
          .formLogin(form -> form
              .loginPage("/api/v1/auth/sign-in") // Trỏ về API login của bạn
              .permitAll()
          )
          // 2. Cấu hình cho OAuth2
          .oauth2Login(oauth2 -> oauth2
            .successHandler((request, response, authentication) -> {
                OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                
                // Gọi Service bạn vừa viết
                OAuth2LoginDTO loginData = authService.processOAuth2Customer(oAuth2User);

                // Tạo URL trả về Frontend (Ví dụ: ReactJS/VueJS chạy ở port 3000)
                String frontendRedirectUrl = "http://localhost:3000/oauth2/callback";

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
}

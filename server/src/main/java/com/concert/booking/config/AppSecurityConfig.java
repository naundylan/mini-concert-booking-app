package com.concert.booking.config;

import com.concert.booking.common.exception.CustomAccessDeniedHandler;
import com.concert.booking.common.exception.CustomAuthenticationEntryPoint;
import com.concert.booking.modules.auth.AuthService;
import com.concert.booking.modules.auth.dto.OAuth2LoginDTO;
import com.concert.booking.modules.auth.dto.TokenDTO;
import com.concert.booking.modules.auth.filter.JwtAuthenticationFilter;
import com.concert.booking.modules.auth.security.AuthCookieService;
import com.concert.booking.modules.auth.security.JwtService;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class AppSecurityConfig {
  private final JwtService jwtService;
  private final CustomAccessDeniedHandler customAccessDeniedHandler;
  private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
  private final AuthService authService;
  private final AuthCookieService authCookieService;

  public AppSecurityConfig(
      JwtService jwtService,
      CustomAccessDeniedHandler customAccessDeniedHandler,
      CustomAuthenticationEntryPoint customAuthenticationEntryPoint,
      @Lazy AuthService authService,
      AuthCookieService authCookieService) {
    this.jwtService = jwtService;
    this.customAccessDeniedHandler = customAccessDeniedHandler;
    this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
    this.authService = authService;
    this.authCookieService = authCookieService;
  }

  static String[] SWAGGER_WHITELIST = {"/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"};
  static String[] PUBLIC_ENDPOINTS = {
    "/",
    "/api/v1/orders/webhooks/**",
    "/api/v1/customer/payments/vietqr/webhook",
    "/api/v1/payments/webhook"
  };
  static String[] AUTH_ENDPOINTS = {
    "/api/v1/auth/sign-in",
    "/api/v1/auth/sign-out",
    "/api/v1/auth/refresh",
    "/api/v1/auth/google",
    "/api/v1/auth/customer/complete-phone",
    "/api/v1/auth/forgot-password",
    "/oauth2/**",
    "/login/**"
  };

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
    http.csrf(csrf -> csrf.disable());
    http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(SWAGGER_WHITELIST)
                    .permitAll()
                    .requestMatchers(AUTH_ENDPOINTS)
                    .permitAll()
                    .requestMatchers(PUBLIC_ENDPOINTS)
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(customAuthenticationEntryPoint)
                    .accessDeniedHandler(customAccessDeniedHandler))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .oauth2Login(
            oauth2 ->
                oauth2.successHandler(
                    (request, response, authentication) -> {
                      OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                      OAuth2LoginDTO loginData = authService.processOAuth2Customer(oAuth2User);

                      String frontendRedirectUrl = "http://144.29.236.199:3000/auth/callback";
                      String targetUrl =
                          frontendRedirectUrl
                              + "?email="
                              + loginData.getUserInfo().getEmail()
                              + "&fullName="
                              + URLEncoder.encode(
                                  loginData.getUserInfo().getFullName(), StandardCharsets.UTF_8)
                              + "&googleId="
                              + loginData.getUserInfo().getGoogleId()
                              + "&role="
                              + loginData.getUserInfo().getRole()
                              + "&hasPhone="
                              + (loginData.getUserInfo().getPhone() != null);

                      if (loginData.getAccessToken() != null) {
                        authCookieService.addAuthCookies(response, toTokenDTO(loginData));
                      }

                      response.sendRedirect(targetUrl);
                    }));

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cors = new CorsConfiguration();
    cors.setAllowCredentials(true);
    cors.setAllowedOriginPatterns(
        List.of(
            "http://localhost:3000",
            "http://localhost:*",
            "http://172.21.240.1:*",
	    "http://114.29.236.199:*",
            "https://*.app.github.dev"));
    cors.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
    cors.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type"));
    cors.setExposedHeaders(List.of("Authorization"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cors);
    return source;
  }

  private TokenDTO toTokenDTO(OAuth2LoginDTO loginData) {
    return TokenDTO.builder()
        .accessToken(loginData.getAccessToken())
        .refreshToken(loginData.getRefreshToken())
        .accessTokenExpiration(loginData.getAccessTokenExpiration())
        .refreshTokenExpiration(loginData.getRefreshTokenExpiration())
        .role(loginData.getUserInfo().getRole())
        .build();
  }
}

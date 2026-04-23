package com.concert.booking.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Component("customAccessDeniedHandler")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
  HandlerExceptionResolver resolver;

  public CustomAccessDeniedHandler(
      @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
    this.resolver = resolver;
  }

  @Override
  public void handle(
      HttpServletRequest request,
      HttpServletResponse response,
      AccessDeniedException accessDeniedException) {
    this.resolver.resolveException(request, response, null, accessDeniedException);
  }
}

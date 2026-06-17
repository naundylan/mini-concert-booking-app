package com.concert.booking.common.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RequestLoadTracker extends OncePerRequestFilter {
  @Getter AtomicInteger activeRequests = new AtomicInteger();

  public int getActiveRequestCount() {
    return activeRequests.get();
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {
    activeRequests.incrementAndGet();
    try {
      filterChain.doFilter(request, response);
    } finally {
      activeRequests.decrementAndGet();
    }
  }
}

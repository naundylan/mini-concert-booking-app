package com.concert.booking.modules.audit;

import com.concert.booking.modules.audit.enums.AuditLogAction;
import com.concert.booking.modules.audit.enums.AuditLogEntity;
import com.concert.booking.modules.audit.enums.AuditLogStatus;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuditLogServiceImpl implements AuditLogService {

  AuditLogRepository auditLogRepository;

  @Override
  @Transactional
  public void log(
      UUID userId,
      String username,
      AuditLogAction action,
      AuditLogEntity entityName,
      String entityId,
      AuditLogStatus status,
      String message) {

    String ipAddress = null;
    String userAgent = null;

    ServletRequestAttributes attributes =
        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    if (attributes != null) {
      HttpServletRequest request = attributes.getRequest();
      ipAddress = getClientIp(request);
      userAgent = request.getHeader("User-Agent");
    }

    AuditLog auditLog =
        AuditLog.builder()
            .userId(userId)
            .username(username)
            .action(action)
            .entityName(entityName)
            .entityId(entityId)
            .status(status)
            .message(message)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .build();

    auditLogRepository.save(auditLog);
  }

  private String getClientIp(HttpServletRequest request) {
    String ip = request.getHeader("X-Forwarded-For");
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("Proxy-Client-IP");
    }
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getHeader("WL-Proxy-Client-IP");
    }
    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
      ip = request.getRemoteAddr();
    }
    return ip;
  }
}

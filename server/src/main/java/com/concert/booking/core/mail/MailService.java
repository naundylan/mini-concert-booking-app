package com.concert.booking.core.mail;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MailService {
  JavaMailSender mailSender;

  public void sendTextMail(String to, String subject, String content) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(to);
    message.setSubject(subject);
    message.setText(content);

    mailSender.send(message);
  }

  public void sendForgotPasswordMail(String to, String token) {
    String resetLink = "http://localhost:3000/reset-password?token=" + token;
    String subject = "Khôi phục mật khẩu";
    String content =
        """
				<html>
				  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
				    <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
				      <h2 style="margin-bottom: 16px;">Khôi phục mật khẩu</h2>
				      <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
				      <p>
				        <a
				          href="%s"
				          style="display: inline-block; padding: 12px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px;">
				          Đặt lại mật khẩu
				        </a>
				      </p>
				      <p>Nếu bạn không gửi yêu cầu này, hãy bỏ qua email và không chia sẻ liên kết với ai.</p>
				      <p style="word-break: break-all; color: #6b7280;">%s</p>
				    </div>
				  </body>
				</html>
				"""
            .formatted(resetLink, resetLink);

    sendHtmlMail(to, subject, content);
  }

  public void sendHtmlMail(String to, String subject, String content) {
    try {
      var message = mailSender.createMimeMessage();
      var helper = new MimeMessageHelper(message, "UTF-8");
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(content, true);
      mailSender.send(message);
    } catch (Exception ex) {
      throw new IllegalStateException("Không thể gửi email", ex);
    }
  }
}

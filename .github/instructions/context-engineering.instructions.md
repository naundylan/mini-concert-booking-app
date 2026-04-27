---
applyTo: "**"
---

# Mini Concert Booking Project Instructions

## Context Dự Án
- **Mô hình:** Monorepo (Backend: Spring Boot trong thư mục /server, Frontend: Next.js).
- **Trục dữ liệu chính:** User Entity sử dụng Số điện thoại (Phone) làm định danh chính (Anchor).
- **Giai đoạn:** Phase 1 (Local Auth cho Staff/Admin) -> Phase 2 (Google Auth cho Customer).

## Quy Tắc Code (Backend)
- **Entity:** Luôn đi kèm `@Getter`, `@Setter`, `@Builder`, và `@FieldDefaults(level = AccessLevel.PRIVATE)`.
- **Audit Log:** Mọi hành động thay đổi dữ liệu (CUD) và Auth phải gọi `AuditLogService`. 
- **Security:** Password phải được băm bằng BCrypt. Sử dụng JWT (Access & Refresh Token).
- **Environment:** Tuyệt đối không hardcode cấu hình. Luôn dùng `${VARIABLE_NAME}` trỏ vào file `.env` ở Root.

## Luồng Xử Lý Ưu Tiên
1. Kiểm tra mỏ neo SĐT khi tạo/gộp User.
2. Ghi chép Audit Log với đầy đủ thông tin IP, UserAgent, và Metadata (JSON).
3. Sử dụng `@Version` để xử lý Optimistic Locking cho các giao dịch đặt vé.

## Agent Role trong dự án
- Khi làm việc với Audit/Security: Yêu cầu sự khắt khe về log.
- Khi làm việc với Booking/Payment: Ưu tiên tính toàn vẹn dữ liệu (Transactions).
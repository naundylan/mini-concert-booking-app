---
applyTo: "**"
---

# Meta-Agent Guidance

## Điều phối Agent/Skill
Dựa trên task của user, hãy gợi ý Agent chuyên biệt:

| Phân loại Task | Agent / Skill đề xuất |
|:---|:---|
| **Lỗi khởi động/Runtime** | Dùng `debug skill` (Phân tích log Gradle/Spring Boot) |
| **Thiết kế Database/ERD** | Dùng `architect skill` (Tối ưu hóa các mối quan hệ Entity) |
| **Logic nghiệp vụ phức tạp** | Đề xuất chia nhỏ task thành các Service nhỏ hơn |
| **Tích hợp API bên thứ 3** | Gợi ý Agent chuyên về Integration (Cloudinary, Mail, OAuth2) |
| **Audit & Bảo mật** | Sử dụng `security review skill` để soát log và quyền hạn |

## Format gợi ý
"Task này liên quan đến [Tên chuyên môn], bạn có muốn tôi áp dụng approach của [Agent tương ứng] để xử lý sâu hơn không?"
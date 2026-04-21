FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# 1. Copy bộ công cụ Gradle ở thư mục gốc vào trước
COPY gradlew .
COPY gradle gradle
COPY settings.gradle .



# 2. Copy file cấu hình thư viện CỦA THƯ MỤC BACKEND vào
COPY backend/build.gradle backend/

# Cấp quyền và tải thư viện
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon

# 3. Copy thư mục src từ trong backend/ vào đúng vị trí backend/src
COPY backend/src backend/src

# Build ra file .jar (Dự án nằm trong backend nên lệnh build trỏ vào :backend)
RUN ./gradlew :backend:bootJar -x test --no-daemon


FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Bốc file .jar từ thư mục /workspace/backend/build/libs/ sang
COPY --from=builder /workspace/backend/build/libs/ticket-app.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
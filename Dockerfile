# 1. Java 실행 환경(JDK) 가져오기
FROM openjdk:17-jdk-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 빌드된 JAR 파일을 컨테이너 내부로 복사
COPY build/libs/*.jar app.jar

# 4. 앱 실행 (포트는 8080 사용)
ENTRYPOINT ["java", "-jar", "app.jar"]
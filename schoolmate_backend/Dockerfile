FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends \
      wkhtmltopdf python3-pip wget unzip \
      fonts-nanum fonts-nanum-coding fonts-nanum-extra \
    && pip install --quiet six lxml \
    && wget -q https://github.com/mete0r/pyhwp/archive/refs/heads/master.zip -O /tmp/pyhwp.zip \
    && unzip -q /tmp/pyhwp.zip -d /tmp \
    && pip install --quiet /tmp/pyhwp-master \
    && rm -rf /tmp/pyhwp* \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
VOLUME /app/upload
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]


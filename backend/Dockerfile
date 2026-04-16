# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime environment
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Install dependencies needed to download and run tectonic
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    fontconfig \
    libgraphite2-3 \
    libharfbuzz0b \
    libharfbuzz-icu0 \
    libicu-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*
# Download, extract, and setup the tectonic binary
RUN curl -L -o tectonic.tar.gz https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@0.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz \
    && tar -xzf tectonic.tar.gz \
    && mv tectonic /usr/local/bin/tectonic \
    && chmod +x /usr/local/bin/tectonic \
    && rm tectonic.tar.gz
# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

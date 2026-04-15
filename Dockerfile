#FROM openjdk:17-jdk
#
#WORKDIR /app
#
#COPY target/spendingTracker-0.0.1-SNAPSHOT.jar app.jar
#
#EXPOSE 8080
#
#ENTRYPOINT ["java","-jar","app.jar"]

#FROM eclipse-temurin:17-jdk
#
#WORKDIR /app
#
#COPY target/spendingTracker-0.0.1-SNAPSHOT.jar app.jar
#
#EXPOSE 8080
#
#ENTRYPOINT ["java","-jar","app.jar"]

FROM eclipse-temurin:17-jdk

WORKDIR /app

# Copy complete project
COPY . .

# Build jar inside container
RUN ./mvnw clean package -DskipTests

# Run jar
CMD ["java","-jar","target/spendingTracker-0.0.1-SNAPSHOT.jar"]
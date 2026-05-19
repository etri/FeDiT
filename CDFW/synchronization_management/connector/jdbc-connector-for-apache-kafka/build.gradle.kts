import java.io.FileOutputStream
import java.net.URL

/*
 * Copyright 2024 Aiven Oy and jdbc-connector-for-apache-kafka contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

plugins {
    // https://docs.gradle.org/current/userguide/java_library_plugin.html
    `java-library`

    // https://docs.gradle.org/current/userguide/distribution_plugin.html
    distribution

    // https://docs.gradle.org/current/userguide/publishing_maven.html
    `maven-publish`

    // https://docs.gradle.org/current/userguide/idea_plugin.html
    idea

    // checkstyle / jacoco plugins removed — they only made sense with the test suite.
}

repositories {
    mavenCentral()
    // Confluent maven repo removed alongside test/integrationTest deps.
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
    withSourcesJar()
}

tasks.wrapper {
    doFirst {
        val sha256Sum = URL("$distributionUrl.sha256").readText()
        propertiesFile.appendText("distributionSha256Sum=${sha256Sum}\n")
        println("Added checksum to wrapper properties")
    }
    distributionType = Wrapper.DistributionType.ALL
}

distributions {
    named("main") {
        contents {
            from(tasks.jar)
            from(configurations.runtimeClasspath)
            from(projectDir) {
                include("version.txt", "README*", "LICENSE*", "NOTICE*", "licenses/")
                include("config/")
            }
        }
    }
}

publishing {
    publications {
        register("maven", MavenPublication::class) {
            // Defaults, for clarity
            groupId = groupId
            artifactId = "jdbc-connector-for-apache-kafka"
            version = version

            from(components["java"])

            pom {
                name = "Aiven's JDBC Sink and Source Connectors for Apache Kafka"
                description = "A Kafka Connect JDBC connector for copying data between databases and Kafka."
                url = "https://aiven.io"
                organization {
                    name = "Aiven Oy"
                    url = "https://aiven.io"
                }
                licenses {
                    license {
                        name = "Apache License 2.0"
                        url = "http://www.apache.org/licenses/LICENSE-2.0.html"
                        distribution = "repo"

                    }
                }
                scm {
                    connection = "scm:git:git://github.com/aiven/jdbc-connector-for-apache-kafka.git"
                    developerConnection = "scm:git:git@github.com:aiven/jdbc-connector-for-apache-kafka.git"
                    url = "https://github.com/aiven/jdbc-connector-for-apache-kafka"
                    tag = "HEAD"
                }
            }
        }
    }
}

val kafkaVersion = "3.3.2"
val slf4jVersion = "2.0.13"

// Test/integrationTest source sets, deps, and tasks removed for license cleanliness
// (avoid pulling EPL-2.0 JUnit, testcontainers, etc.) and to shrink the source surface.

dependencies {
    compileOnly("org.apache.kafka:connect-api:$kafkaVersion")

    runtimeOnly("org.xerial:sqlite-jdbc:3.46.0.1")
    runtimeOnly("org.postgresql:postgresql:42.7.3")
    // Oracle JDBC (ojdbc8) removed for license cleanliness — Oracle Free Use Terms
    // are non-OSS and incompatible with Apache-2.0 redistribution.
    // If Oracle support is required at runtime, add the driver to your Kafka Connect
    // plugin path at deployment time and accept Oracle's license separately.
    runtimeOnly("net.sourceforge.jtds:jtds:1.3.1")
    runtimeOnly("net.snowflake:snowflake-jdbc:3.16.1")
    runtimeOnly("com.microsoft.sqlserver:mssql-jdbc:12.6.1.jre11")
    runtimeOnly("com.mysql:mysql-connector-j:8.4.0")

    implementation("com.google.guava:guava:33.2.1-jre")
    implementation("org.slf4j:slf4j-api:$slf4jVersion")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.16.2")
}

tasks.processResources {
    filesMatching("jdbc-connector-for-apache-kafka-version.properties") {
        expand(mapOf("version" to version))
    }
}

tasks.register("connectorConfigDoc") {
    description = "Generates the connector's configuration documentation."
    group = "documentation"
    dependsOn("classes")

    doLast {
        project.javaexec {
            mainClass = "io.aiven.connect.jdbc.source.JdbcSourceConnectorConfig"
            classpath = sourceSets.main.get().runtimeClasspath + sourceSets.main.get().compileClasspath
            standardOutput = FileOutputStream("$projectDir/docs/source-connector-config-options.rst")
        }
        project.javaexec {
            mainClass = "io.aiven.connect.jdbc.sink.JdbcSinkConfig"
            classpath = sourceSets.main.get().runtimeClasspath + sourceSets.main.get().compileClasspath
            standardOutput = FileOutputStream("$projectDir/docs/sink-connector-config-options.rst")
        }
    }
}

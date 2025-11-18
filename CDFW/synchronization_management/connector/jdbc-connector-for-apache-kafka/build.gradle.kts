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
    `java-library`
    distribution
    `maven-publish`
    idea
}

repositories {
    mavenCentral()
    maven("https://packages.confluent.io/maven")
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
            from(components["java"])

            pom {
                name.set("Aiven's JDBC Sink and Source Connectors for Apache Kafka")
                description.set("A Kafka Connect JDBC connector for copying data between databases and Kafka.")
                url.set("https://aiven.io")

                organization {
                    name.set("Aiven Oy")
                    url.set("https://aiven.io")
                }

                licenses {
                    license {
                        name.set("Apache License 2.0")
                        url.set("http://www.apache.org/licenses/LICENSE-2.0.html")
                        distribution.set("repo")
                    }
                }

                scm {
                    connection.set("scm:git:git://github.com/aiven/jdbc-connector-for-apache-kafka.git")
                    developerConnection.set("scm:git:git@github.com:aiven/jdbc-connector-for-apache-kafka.git")
                    url.set("https://github.com/aiven/jdbc-connector-for-apache-kafka")
                    tag.set("HEAD")
                }
            }
        }
    }
}

val kafkaVersion = "3.3.2"
val slf4jVersion = "2.0.13"

val avroVersion = "1.8.1"
val confluentPlatformVersion = "4.1.4"
val hamcrestVersion = "2.2"
val jacksonVersion = "2.17.2"
val jupiterVersion = "5.11.0"
val servletVersion = "4.0.1"
val testcontainersVersion = "1.20.2"
val awaitilityVersion = "4.2.1"
val log4jVersion = "2.20.0"

val derbyVersion = "10.15.2.0"
val mockitoVersion = "5.12.0"

sourceSets {
    create("integrationTest") {
        java.srcDir(file("src/integrationTest/java"))
        compileClasspath += sourceSets.main.get().output + configurations.testRuntimeClasspath.get()
        runtimeClasspath += output + compileClasspath
    }
}

idea {
    module {
        testSources.from(project.sourceSets["integrationTest"].java.srcDirs)
        testSources.from(project.sourceSets["integrationTest"].resources.srcDirs)
    }
}

val integrationTestImplementation: Configuration by configurations.getting {
    extendsFrom(configurations["testImplementation"])
}

val integrationTestRuntimeOnly: Configuration by configurations.getting {
    extendsFrom(configurations["testRuntimeOnly"])
}


dependencies {
    compileOnly("org.apache.kafka:connect-api:$kafkaVersion")
    runtimeOnly("org.postgresql:postgresql:42.7.3")

    implementation("org.slf4j:slf4j-api:$slf4jVersion")
    implementation("com.fasterxml.jackson.core:jackson-databind:$jacksonVersion")
}


tasks {
    create("integrationTest", Test::class) {
        description = "Runs the integration tests."
        group = "verification"
        testClassesDirs = sourceSets["integrationTest"].output.classesDirs
        classpath = sourceSets["integrationTest"].runtimeClasspath

        dependsOn(testClasses, distTar)

        outputs.upToDateWhen { false }

        systemProperty("integration-test.distribution.file.path", distTar.get().archiveFile.get().asFile.path)
    }
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
            mainClass.set("io.aiven.connect.jdbc.source.JdbcSourceConnectorConfig")
            classpath = sourceSets.main.get().runtimeClasspath + sourceSets.main.get().compileClasspath
            standardOutput = FileOutputStream("$projectDir/docs/source-connector-config-options.rst")
        }
        project.javaexec {
            mainClass.set("io.aiven.connect.jdbc.sink.JdbcSinkConfig")
            classpath = sourceSets.main.get().runtimeClasspath + sourceSets.main.get().compileClasspath
            standardOutput = FileOutputStream("$projectDir/docs/sink-connector-config-options.rst")
        }
    }
}



tasks.withType<Test> {
    enabled = false
}
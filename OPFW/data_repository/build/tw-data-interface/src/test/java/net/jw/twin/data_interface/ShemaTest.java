package net.jw.twin.data_interface;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.dataformat.avro.AvroMapper;
import com.fasterxml.jackson.dataformat.avro.AvroSchema;
import com.fasterxml.jackson.dataformat.avro.jsr310.AvroJavaTimeModule;
import com.fasterxml.jackson.dataformat.avro.schema.AvroSchemaGenerator;
import net.jw.twin.db.visitjeju.model.Visitjeju;
import net.jw.twin.db.weather.model.Weather;
import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ShemaTest {
    @Test
    public void writeSchemaFromClass() throws IOException {
        AvroMapper avroMapper = AvroMapper.builder()
                .disable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
                .addModule(new AvroJavaTimeModule())
                .build();

        avroMapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        createAvroSchemaFromClass(Visitjeju.class, avroMapper);
    }

    private static void createAvroSchemaFromClass(Class<?> clazz, AvroMapper avroMapper) throws IOException {
        AvroSchemaGenerator gen = new AvroSchemaGenerator();
        gen.enableLogicalTypes();
        avroMapper.acceptJsonFormatVisitor(clazz, gen);
        AvroSchema schemaWrapper = gen.getGeneratedSchema();

        org.apache.avro.Schema avroSchema = schemaWrapper.getAvroSchema();
        String avroSchemaInJSON = avroSchema.toString(true);

        Path directory = Paths.get("src","test", "schema");

        if(!Files.exists(directory)){
            Files.createDirectories(directory);
        }

        //Write to File
        java.nio.file.Path fileName = java.nio.file.Paths.get("src","test", "schema", clazz.getSimpleName() + ".avsc");
        java.nio.file.Files.write(fileName, avroSchemaInJSON.getBytes());
    }

    @Test
    public void getClassName() {
        System.out.println(Weather.class.getName());
        String key = "K_DTA_BeachWeather";
        System.out.println(StringUtils.substringAfterLast(key, "_"));
    }
}

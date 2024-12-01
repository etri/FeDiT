package kr.co.e8ight.ndxpro.databroker.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.convert.*;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

@Configuration
@EnableMongoAuditing
public class MongoDBConfiguration extends AbstractMongoClientConfiguration {

    @Value("${spring.data.mongodb.uri}")
    private String mongodbUri;

    @Value("${spring.data.mongodb.databaseName}")
    private String databaseName;

    @Override
    public MongoClient mongoClient() {
        return MongoClients.create(mongodbUri + databaseName);
    }

    @Override
    protected String getDatabaseName() {
        return databaseName;
    }

    @Override
    public MappingMongoConverter mappingMongoConverter(MongoDatabaseFactory databaseFactory,
                                                       MongoCustomConversions customConversions, MongoMappingContext mappingContext) {

        DbRefResolver dbRefResolver = new DefaultDbRefResolver(databaseFactory);
        MappingMongoConverter converter = new MappingMongoConverter(dbRefResolver, mappingContext);
        converter.setCustomConversions(customConversions);
        converter.setCodecRegistryProvider(databaseFactory);
        converter.setTypeMapper(new DefaultMongoTypeMapper(null));
        return converter;
    }
}
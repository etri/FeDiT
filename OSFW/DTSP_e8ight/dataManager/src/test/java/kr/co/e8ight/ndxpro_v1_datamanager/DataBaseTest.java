package kr.co.e8ight.ndxpro_v1_datamanager;


import com.mongodb.client.MongoCollection;
import org.assertj.core.api.Assertions;
import org.bson.Document;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;


@TestPropertySource(locations = "/application.yml")
@ContextConfiguration(classes = NdxProV1DataManagerApplication.class)
@DataMongoTest
@ExtendWith(SpringExtension.class)
@DirtiesContext
public class DataBaseTest {

    @Autowired
    MongoTemplate mongoTemplate;

    @DisplayName("Test Embedded MongoDB")
    @Test
    public void ConnectTest() {

        MongoCollection<Document> test = mongoTemplate.createCollection("Test");

        Document document = new Document("name", "ndxpro");

        test.insertOne(document);

        Document oneAndDelete = test.findOneAndDelete(document);

        Assertions.assertThat(oneAndDelete).isEqualTo(document);

    }
}

package kr.co.e8ight.ndxpro.translatorRunner.translator;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Attribute;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity.Builder;
import kr.co.e8ight.ndxpro.translatorRunner.vo.EntityId;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class EPCTranslator extends EntityTranslator {

  private static final Logger log = LoggerFactory.getLogger(EPCTranslator.class);

  public EPCTranslator(String context) {
    this.context = context;
  }

  @Override
  public List<Entity> translate(JSONObject jsonObject) {
    List<Entity> entities = new ArrayList<>();
    JSONArray data = jsonObject.getJSONArray("data");

    Map<String, String> entityAttrNames = new LinkedHashMap<>();
    entityAttrNames.put("tagId", "e8ight:tagId");
    entityAttrNames.put("installationDate", "e8ight:installationDate");
    entityAttrNames.put("manufacturer", "e8ight:manufacturer");
    Map<String, String> model2dEntityAttrNames = new LinkedHashMap<>();
    Map<String, String> model3dEntityAttrNames = new LinkedHashMap<>();
    Map<String, String> file2dEntityAttrNames = new LinkedHashMap<>();
    file2dEntityAttrNames.put("isFileOf", "e8ight:isFileOf");
    file2dEntityAttrNames.put("path", "e8ight:path");
    file2dEntityAttrNames.put("extension", "e8ight:extension");
    Map<String, String> file3dEntityAttrNames = new LinkedHashMap<>();
    file3dEntityAttrNames.put("isFileOf", "e8ight:isFileOf");
    file3dEntityAttrNames.put("path", "e8ight:path");
    file3dEntityAttrNames.put("extension", "e8ight:extension");

    List<Attribute> file2dEntityAttrs = new ArrayList<>();
    List<Attribute> file3dEntityAttrs = new ArrayList<>();

    List<String> model2dEntityIdList = new ArrayList<>();
    List<String> model3dEntityIdList = new ArrayList<>();
    for (int i = 0; i < data.length(); i++) {
      JSONObject entityData = data.getJSONObject(i);
      String modelType = entityData.getString("class");
      String id = entityData.getString("tagId");

      List<Attribute> entityAttrs = new ArrayList<>();
      EntityId entityId = new EntityId.Builder()
          .id(id)
          .type(modelType)
          .provider("EPC")
          .build();
      entityAttrs.add(new Attribute.Builder()
          .name("tagId")
          .type("Property")
          .value(id)
          .build());
      ZonedDateTime zonedDateTime = LocalDateTime.now()
          .atZone(ZoneOffset.of("+09:00")).withZoneSameInstant(ZoneOffset.UTC);
      entityAttrs.add(new Attribute.Builder()
          .name("installationDate")
          .type("Property")
          .value(zonedDateTime)
          .build());
      entityAttrs.add(new Attribute.Builder()
          .name("manufacturer")
          .type("Property")
          .value("Redhat")
          .build());
      if ( jsonObject.has("svgUfid") ) {
        entityAttrs.add(new Attribute.Builder()
            .name("hasModel2D")
            .type("Relationship")
            .value(List.of("urn:ngsi-ld:Model2D:" + modelType + ":" + id))
            .build());
      }
//      if ( jsonObject.has("fbxUfid") ) {
        entityAttrs.add(new Attribute.Builder()
            .name("hasModel3D")
            .type("Relationship")
            .value(List.of("urn:ngsi-ld:Model3D:" + modelType + ":" + id))
            .build());
//      }

      Entity entity = new Entity.Builder()
          .id(entityId)
          .attrNames(entityAttrNames)
          .attrs(entityAttrs)
          .context(this.context)
          .build();
      entities.add(entity);

      if ( jsonObject.has("svgUfid") ) {
        List<Attribute> model2dEntityAttrs = new ArrayList<>();
        model2dEntityIdList.add("urn:ngsi-ld:Model2D:" + modelType + ":" + id);
        EntityId model2dEntityId = new EntityId.Builder()
            .id(modelType + ":" + id)
            .type("Model2D")
            .provider("EPC")
            .build();
        model2dEntityAttrs.add(new Attribute.Builder()
            .name("isModel2DOf")
            .type("Relationship")
            .value(List.of("urn:ngsi-ld:" + modelType + ":" + id))
            .build());
        model2dEntityAttrs.add(new Attribute.Builder()
            .name("hasFile")
            .type("Relationship")
            .value(List.of("urn:ngsi-ld:File:" + jsonObject.getString("svgUfid")))
            .build());
        Entity model2dEntity = new Entity.Builder()
            .id(model2dEntityId)
            .attrNames(model2dEntityAttrNames)
            .attrs(model2dEntityAttrs)
            .context(this.context)
            .build();
        entities.add(model2dEntity);
      }

//      if ( jsonObject.has("fbxUfid") ) {
        List<Attribute> model3dEntityAttrs = new ArrayList<>();
        model3dEntityIdList.add("urn:ngsi-ld:Model3D:" + modelType + ":" + id);
        EntityId model3dEntityId = new EntityId.Builder()
            .id(modelType + ":" + id)
            .type("Model3D")
            .provider("EPC")
            .build();
        model3dEntityAttrs.add(new Attribute.Builder()
            .name("isModel3DOf")
            .type("Relationship")
            .value(List.of("urn:ngsi-ld:" + modelType + ":" + id))
            .build());
        model3dEntityAttrs.add(new Attribute.Builder()
            .name("hasFile")
            .type("Relationship")
//            .value(List.of("urn:ngsi-ld:File:" + jsonObject.getString("fbxUfid")))
            .value(List.of("urn:ngsi-ld:File:08b4bde4898c5535b30e0ed6a5463b53"))
            .build());
        Entity model3dEntity = new Entity.Builder()
            .id(model3dEntityId)
            .attrNames(model3dEntityAttrNames)
            .attrs(model3dEntityAttrs)
            .context(this.context)
            .build();
        entities.add(model3dEntity);
//      }
    }

    if ( jsonObject.has("svgUfid") ) {
      String svgUfid = jsonObject.getString("svgUfid");
      file2dEntityAttrs.add(new Attribute.Builder()
          .name("path")
          .type("Property")
          .value("http://172.16.28.223:54020/ndxpro/v1/file-service/files/" + svgUfid)
          .build());
      file2dEntityAttrs.add(new Attribute.Builder()
          .name("extension")
          .type("Property")
          .value("svg")
          .build());

      EntityId file2dEntityId = new EntityId.Builder()
          .id(jsonObject.getString("svgUfid"))
          .type("File")
          .provider("EPC")
          .build();

      entityAttrNames.put("hasModel2D", "e8ight:hasModel2D");
      model2dEntityAttrNames.put("isModel2DOf", "e8ight:isModel2DOf");
      model2dEntityAttrNames.put("hasFile", "e8ight:hasFile");

      file2dEntityAttrs.add(new Attribute.Builder()
          .name("isFileOf")
          .type("Relationship")
          .value(model2dEntityIdList)
          .build());

      Entity file2dEntity = new Entity.Builder()
          .id(file2dEntityId)
          .attrNames(file2dEntityAttrNames)
          .attrs(file2dEntityAttrs)
          .context(this.context)
          .build();
      entities.add(file2dEntity);
    }

//    if ( jsonObject.has("fbxUfid") ) {
//      String fbxUfid = jsonObject.getString("fbxUfid");
      String fbxUfid = "08b4bde4898c5535b30e0ed6a5463b53";
      file3dEntityAttrs.add(new Attribute.Builder()
          .name("path")
          .type("Property")
          .value("http://172.16.28.223:54020/ndxpro/v1/file-service/files/" + fbxUfid)
          .build());
      file3dEntityAttrs.add(new Attribute.Builder()
          .name("extension")
          .type("Property")
          .value("fbx")
          .build());

      EntityId file3dEntityId = new EntityId.Builder()
          .id(fbxUfid)
          .type("File")
          .provider("EPC")
          .build();

      entityAttrNames.put("hasModel3D", "e8ight:hasModel3D");
      model3dEntityAttrNames.put("isModel3DOf", "e8ight:isModel3DOf");
      model3dEntityAttrNames.put("hasFile", "e8ight:hasFile");

      file3dEntityAttrs.add(new Attribute.Builder()
          .name("isFileOf")
          .type("Relationship")
          .value(model3dEntityIdList)
          .build());

      Entity file3dEntity = new Entity.Builder()
          .id(file3dEntityId)
          .attrNames(file3dEntityAttrNames)
          .attrs(file3dEntityAttrs)
          .context(this.context)
          .build();
      entities.add(file3dEntity);
//    }
    return entities;
  }
}
package kr.co.e8ight.ndxpro.translatorRunner.translator;

import kr.co.e8ight.ndxpro.translatorRunner.vo.Entity;
import org.json.JSONObject;

import java.util.List;

public abstract class EntityTranslator {

    protected String context;

    public abstract List<Entity> translate(JSONObject value);
}

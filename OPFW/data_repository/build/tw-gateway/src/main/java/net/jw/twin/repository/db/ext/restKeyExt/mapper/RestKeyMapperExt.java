package net.jw.twin.repository.db.ext.restKeyExt.mapper;

import net.jw.twin.repository.db.restKey.mapper.RestKeyMapper;
import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RestKeyMapperExt extends RestKeyMapper {
    RestKey test(RestKeySearch search);
}

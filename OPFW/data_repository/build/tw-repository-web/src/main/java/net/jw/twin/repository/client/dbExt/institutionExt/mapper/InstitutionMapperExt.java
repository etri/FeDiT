package net.jw.twin.repository.client.dbExt.institutionExt.mapper;

import net.jw.twin.repository.db.institution.mapper.InstitutionMapper;
import net.jw.twin.repository.db.institution.model.InstitutionSearch;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface InstitutionMapperExt extends InstitutionMapper {
    List<Map<String, Object>> selectListWithManagerName(InstitutionSearch search);
}

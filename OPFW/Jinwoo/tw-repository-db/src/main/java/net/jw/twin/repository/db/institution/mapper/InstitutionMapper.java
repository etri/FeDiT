package net.jw.twin.repository.db.institution.mapper;

import org.apache.ibatis.annotations.Mapper;
import net.jw.twin.repository.db.institution.model.Institution;
import net.jw.twin.repository.db.institution.model.InstitutionSearch;
import net.jcms.framework.base.mapper.BaseMapper;
import java.util.List;

@Mapper
public interface InstitutionMapper extends BaseMapper<Institution, InstitutionSearch> {
	void insertList(List<Institution> datas);
	int countNullCheck(InstitutionSearch search);
	List<Institution> selectListNullCheck(InstitutionSearch search);
	int deleteSoft(Institution data);
}
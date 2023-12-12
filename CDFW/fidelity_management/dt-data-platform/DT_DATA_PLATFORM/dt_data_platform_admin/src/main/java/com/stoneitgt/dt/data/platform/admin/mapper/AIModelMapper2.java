package com.stoneitgt.dt.data.platform.admin.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.session.RowBounds;

import com.stoneitgt.dt.data.platform.domain.AugmentModel;
import com.stoneitgt.dt.data.platform.domain.Menu;
import com.stoneitgt.dt.data.platform.domain.MenuAuth;

@Mapper
public interface AIModelMapper2 {

	List<Map<String, Object>> getModelLoss(int modelSeq);
	List<Map<String, Object>> getModelFID(int modelSeq);
}

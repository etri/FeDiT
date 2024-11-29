package net.jw.twin.repository.db.ext.restKeyExt.service;

import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.ext.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.db.ext.dataUseExt.service.DataUseServiceExt;
import net.jw.twin.repository.db.ext.restKeyExt.mapper.RestKeyMapperExt;
import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jw.twin.repository.db.restKey.service.RestKeyServiceAbst;
import net.jw.twin.tw_service_manager.global.CodeValue;
import org.mybatis.spring.MyBatisSystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service(value="restKeyServiceExt")
public class RestKeyServiceExtImpl extends RestKeyServiceAbst<RestKeyMapperExt> implements RestKeyServiceExt {

	@Autowired
	private DataUseServiceExt dataUseServiceExt;

	@Override
	@Autowired
	@Qualifier("restKeyMapperExt")
	public void setMapper(RestKeyMapperExt mapper) {
		super.setMapper(mapper);
	}

	@Override
	@Transactional
	public RestKey test(RestKeySearch search) {
		return mapper.test(search);
	}

	@Override
	@Transactional
	public DataUse validateUsageRequest(String serviceId, String token) {

		RestKeySearch restKeySearch = RestKeySearch.builder()
				.token(token)
				.status(CodeValue.RestKeyStatus.issued.name())
				.build();

		RestKey restKey = null;
		try {
			restKey = select(restKeySearch);
		} catch (MyBatisSystemException e) {
			throw new RuntimeException("restKey 조회중 오류가 발생하였습니다.");
		}

		if( null == restKey ) {
			throw new RuntimeException("유효한 restKey 데이터가 없습니다.");
		}

		DataUseSearchExt dataUseSearchExt = DataUseSearchExt.builder()
				.userId(restKey.getUserId())
				.serviceId(serviceId)
				.status(CodeValue.DataUseStatus.approved.getName())
				.dataItemStatus(CodeValue.DataItemStatus.approved.getName())
				.build();

		DataUse dataUse = null;
		try {
			dataUse = dataUseServiceExt.selectByServiceId(dataUseSearchExt);
		} catch (MyBatisSystemException e) {
			throw new RuntimeException("dataUse 조회중 오류가 발생하였습니다.");
		}

		if( null == dataUse ){
			throw new RuntimeException("유효한 dataUse 데이터가 없습니다.");
		}

		if(!dataUseServiceExt.isCallCountBelowMax(dataUse)) {
			throw new RuntimeException("데이터 최대 사용량을 초과하였습니다.");
		}

		return dataUse;
	}

	@Override
	@Transactional
	public void usageRequest(String dataCode, String token) {

		DataUse dataUse = validateUsageRequest(dataCode, token);

		dataUse.setCurrentCallCount(dataUse.getCurrentCallCount() + 1);

		try {
			dataUseServiceExt.update(dataUse);
		} catch (Exception e) {
			throw new RuntimeException("dataUse 갱신 중 오류가 발생하였습니다.");
		}
	}
}

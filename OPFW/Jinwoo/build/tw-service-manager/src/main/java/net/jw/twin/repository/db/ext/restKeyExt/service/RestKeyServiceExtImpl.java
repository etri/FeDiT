package net.jw.twin.repository.db.ext.restKeyExt.service;

import net.jw.twin.common.exception.CustomException;
import net.jw.twin.repository.db.dataUse.model.DataUse;
import net.jw.twin.repository.db.ext.dataUseExt.model.DataUseSearchExt;
import net.jw.twin.repository.db.ext.dataUseExt.service.DataUseServiceExt;
import net.jw.twin.repository.db.ext.restKeyExt.mapper.RestKeyMapperExt;
import net.jw.twin.repository.db.restKey.model.RestKey;
import net.jw.twin.repository.db.restKey.model.RestKeySearch;
import net.jw.twin.repository.db.restKey.service.RestKeyServiceAbst;
import net.jw.twin.tw_service_manager.exception.ErrorStatus;
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
			throw new CustomException(ErrorStatus.DB__FAIL_SELECT, "rest key token : " + token, "data.table.restKey");
		}

		if( null == restKey ) {
			throw new CustomException(ErrorStatus.DB__FAIL_SELECT_NOT_FOUND, "rest key token : " + token, "data.table.restKey");
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
			throw new CustomException(ErrorStatus.DB__FAIL_SELECT, "rest key token : " + token, "data.table.dataUse");
		}

		if( null == dataUse ){
			throw new CustomException(ErrorStatus.DB__FAIL_SELECT_NOT_FOUND, "rest key token : " + token, "data.table.dataUse");
		}

		if(!dataUseServiceExt.isCallCountBelowMax(dataUse)) {
			throw new CustomException(ErrorStatus.DATAUSE__EXCEED_MAXCOUNT, "data id : " + dataUse.getDataId());
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
			throw new CustomException(ErrorStatus.DB__FAIL_UPDATE, "rest key token : " + token, "data.table.dataUse");
		}
	}
}

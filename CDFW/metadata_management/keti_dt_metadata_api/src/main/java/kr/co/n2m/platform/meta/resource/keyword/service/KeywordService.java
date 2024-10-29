package kr.co.n2m.platform.meta.resource.keyword.service;

import java.util.Arrays;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.n2m.platform.meta.architecture.exception.ResBadRequestException;
import kr.co.n2m.platform.meta.architecture.exception.ResBaseRuntimeException;
import kr.co.n2m.platform.meta.architecture.exception.ResBizInfoException;
import kr.co.n2m.platform.meta.resource.keyword.domain.KeywordVo;
import kr.co.n2m.platform.meta.resource.keyword.mapper.KeywordMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(transactionManager = "rdbTransactionManager")
public class KeywordService {
	
	@Autowired
	private KeywordMapper keywordMapper;
	
	/**
	 * 키워드 저장 (Multi)
	 * @Author      : heenim
	 * @Date        : 2023. 05. 30.
	 * @param keywordList
	 * @param langMtcd
	 * @return
	 */
	public int saveKeywordList(List<String> keywordList, String langMtcd) {
		log.debug("[키워드 저장 (Multi)] 서비스 시작");
		int cnt = 0;
		
		try {
			if (keywordList != null && keywordList.size() > 0) {
				KeywordVo kVo = null;
				for (String kywrd : keywordList) {
					kywrd = StringUtils.trimToNull(kywrd);
					if (kywrd != null) {
						kVo = new KeywordVo();
						kVo.setKywrd(kywrd);
						kVo.setKywrdLangMtcd(langMtcd);
						int updateCnt = keywordMapper.updateKeywordRecntDt(kVo);
						if (updateCnt == 0) {
							cnt += keywordMapper.insertKeyword(kVo);
						} else {
							cnt += updateCnt;
						}
					}
				}
			}
			log.debug("[키워드 저장 (Multi)] 총 {}건 중 저장 성공 : {}건", keywordList.size(), cnt);
		
		} catch (ResBadRequestException | ResBizInfoException e) {
			log.info("[키워드 저장 (Multi)] 실패/오류 (정보성) : {}", e.getMessage());
			throw e;			
		} catch (Exception e) {
			log.error("[키워드 저장 (Multi)] 실패/오류", e);
			throw new ResBaseRuntimeException(e);
		}		
		
		log.debug("[키워드 저장 (Multi)] 서비스 종료");
			
		return cnt;
	}

	/**
	 * 콤마(",")로 나열된 키워드 문자열 저장
	 * @Author      : heenim
	 * @Date        : 2023. 05. 30.
	 * @param keywords
	 * @param langMtcd
	 * @return
	 */
	public int saveKeywordList(String keywords, String langMtcd) {
		if (keywords == null) return 0;
		List<String> list = Arrays.asList(keywords.split(","));
		return saveKeywordList(list, langMtcd);
	}
	
}

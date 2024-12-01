package kr.co.e8ight.ndxpro.agentManager.repository;

import java.util.List;
import kr.co.e8ight.ndxpro.agentManager.domain.AttributeSource;
import kr.co.e8ight.ndxpro.agentManager.domain.DataModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttributeSourceRepository extends JpaRepository<AttributeSource, Long>{

  List<AttributeSource> findByDataModel(DataModel dataModel);
}

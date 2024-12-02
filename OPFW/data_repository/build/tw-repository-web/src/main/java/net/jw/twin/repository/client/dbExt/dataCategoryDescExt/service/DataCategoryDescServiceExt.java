package net.jw.twin.repository.client.dbExt.dataCategoryDescExt.service;

import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDesc;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDescSearch;
import net.jw.twin.repository.db.dataCategoryDesc.service.DataCategoryDescService;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface DataCategoryDescServiceExt extends DataCategoryDescService {
    int deleteSoftWithIconFile(DataCategoryDesc dataCategoryDesc);
    List<DataCategoryDesc> selectListWithIconFileInfo(DataCategoryDescSearch search);
    void insertWithFile(DataCategoryDesc dataCategoryDesc, MultipartFile iconFile) throws IOException;
    void updateWithFile(DataCategoryDesc dataCategoryDesc, MultipartFile iconFile) throws IOException;
}

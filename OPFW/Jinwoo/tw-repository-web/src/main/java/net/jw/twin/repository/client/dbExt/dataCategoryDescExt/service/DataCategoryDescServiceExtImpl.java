package net.jw.twin.repository.client.dbExt.dataCategoryDescExt.service;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.file.model.FileItem;
import net.jcms.framework.file.model.FileItemSearch;
import net.jcms.framework.file.service.FileItemService;
import net.jw.twin.repository.client.dbExt.dataCategoryDescExt.mapper.DataCategoryDescMapperExt;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDesc;
import net.jw.twin.repository.db.dataCategoryDesc.model.DataCategoryDescSearch;
import net.jw.twin.repository.db.dataCategoryDesc.service.DataCategoryDescServiceAbst;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service(value = "dataCategoryDescServiceExt")
public class DataCategoryDescServiceExtImpl extends DataCategoryDescServiceAbst<DataCategoryDescMapperExt> implements DataCategoryDescServiceExt {

    @Autowired
    @Qualifier("fileItemService")
    private FileItemService fileItemService;

    @Override
    @Autowired
    @Qualifier("dataCategoryDescMapperExt")
    public void setMapper(DataCategoryDescMapperExt mapper) {
        super.setMapper(mapper);
    }

    @Override
    public List<DataCategoryDesc> selectListWithIconFileInfo(DataCategoryDescSearch search) {
        return mapper.selectListWithIconFileInfo(search);
    }

    @Override
    @Transactional
    public int deleteSoftWithIconFile(DataCategoryDesc dataCategoryDesc) {
        try {
            DataCategoryDescSearch search = new DataCategoryDescSearch(dataCategoryDesc);
            DataCategoryDesc found = select(search);

            int count = deleteSoft(found);
            if (count != 1) {
                throw new CustomException(ErrorStatus.E_DB__FAIL_DELETE, "data category desc : " + found.getCategory());
            }
            count = fileItemService.deleteFileById(found.getIconFileId());
            if (count != 1) {
                throw new CustomException(ErrorStatus.E_COMMON__UNKNOWN, "failed  to delete prev icon file. dataCategoryDesc : " + found.getCategory());
            }
        } catch (CustomException ce) {
            throw ce;
        } catch (Exception e) {
            throw new CustomException(ErrorStatus.E_DB__FAIL_DELETE, e.getCause(), e.getMessage());
        }
        return 1;
    }

    @Override
    @Transactional
    public void insertWithFile(DataCategoryDesc dataCategoryDesc, MultipartFile iconFile) throws IOException {
        FileItem fileItem = null;

        try {
            fileItem = fileItemService.saveFileWithUpDirectory(iconFile, "icon");

            dataCategoryDesc.setIconFileId(fileItem.getItemId());

            insert(dataCategoryDesc);
        } catch (Exception e) {
            if (fileItem != null) {
                fileItemService.delete(fileItem);
            }
            throw e;
        }
    }

    @Override
    @Transactional
    public void updateWithFile(DataCategoryDesc dataCategoryDesc, MultipartFile iconFile) throws IOException {
        FileItemSearch search = FileItemSearch.builder()
                .itemId(dataCategoryDesc.getIconFileId())
                .build();

        FileItem prevFileItem = fileItemService.select(search);
        if (null == prevFileItem) {
            throw new CustomException(ErrorStatus.E_COMMON__DATACATEGORY__NO_ICON_FILE, "dataCategoryDesc : " + dataCategoryDesc.getCategory());
        }

        FileItem fileItem = fileItemService.updateFile(iconFile, prevFileItem.getItemId());

        dataCategoryDesc.setIconFileId(fileItem.getFileId());

        update(dataCategoryDesc);
    }
}

package com.stoneitgt.dt.data.platform.admin.service;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.stoneitgt.dt.data.platform.admin.mapper.ResourceMapper;
import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import com.stoneitgt.dt.data.platform.domain.Resource;
import com.stoneitgt.dt.data.platform.util.file.FileUtil;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ResourceService extends BaseService {

    @Autowired
    private ResourceMapper resourceMapper;

    public HashMap<String, Object> saveResource(MultipartFile attachFile, String type, String directory, int loginUserSeq, String loginUserIp)
            throws IOException {
        HashMap<String, Object> result = new HashMap<String, Object>();
        long fileLen = attachFile.getSize();

        if (fileLen > 0) {
            Resource resource = new Resource();
            resource.setFileNm(attachFile.getOriginalFilename());
            //resource.setFileLen(fileLen);
            resource.setFileSz(fileLen);
            //resource.setRefType(directory.toUpperCase());
            resource.setRefTp(type);

            resource.setFileExtn(FileUtil.getFileExtension(resource.getFileNm()));
            resource.setLoginUserSeq(loginUserSeq);
            resource.setLoginUserIp(loginUserIp);

            resourceMapper.insertResource(resource);

            String filePath = FileUtil.getUploadFilePath(directory);
            resource.setFilePath(filePath + resource.getResourceSeq());

            File file = FileUtil.uploadFile(systemProperties.getUploadFilePath() + resource.getFilePath(), attachFile);
            resource.setFileContsTp(FileUtil.getFileContentType(file));
            result.put("url", resource.getFilePath());
            result.put("domain", systemProperties.getResuorceLinkUrl());

            resourceMapper.updateResource(resource);
        }

        return result;
    }
}

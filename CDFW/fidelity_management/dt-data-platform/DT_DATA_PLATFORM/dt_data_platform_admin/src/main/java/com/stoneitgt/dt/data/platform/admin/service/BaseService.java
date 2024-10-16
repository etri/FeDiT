package com.stoneitgt.dt.data.platform.admin.service;

import org.springframework.beans.factory.annotation.Autowired;

import com.stoneitgt.dt.data.platform.admin.properties.SystemProperties;
import org.springframework.stereotype.Service;

@Service
public class BaseService {

    @Autowired
    public SystemProperties systemProperties;

    @Autowired
    public FilesService filesService;

}

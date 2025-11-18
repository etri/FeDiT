package com.stoneitgt.dt.data.platform.admin.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * yml 파일에 등록되어 있는 시스템 변수에 대한 클래스
 *
 * @author yh.kim
 *
 */
@Data
@EqualsAndHashCode(callSuper = true)
@ConfigurationProperties("system")
@Component
public class SystemProperties extends BaseSystemProperties {

}

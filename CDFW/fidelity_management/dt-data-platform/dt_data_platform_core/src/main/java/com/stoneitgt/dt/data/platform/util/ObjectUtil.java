package com.stoneitgt.dt.data.platform.util;

import java.util.List;
import java.util.Optional;

import javax.servlet.http.HttpServletRequest;


import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ObjectUtil {
	
	public static String getClientIP(HttpServletRequest request) {
		String ip = request.getHeader("X-FORWARDED-FOR");
		if (ip == null) {
			ip = request.getHeader("Proxy-Client-IP");
		}
		if (ip == null) {
			ip = request.getHeader("WL-Proxy-Client-IP");
		}
		if (ip == null) {
			ip = request.getHeader("HTTP_CLIENT_IP");
		}
		if (ip == null) {
			ip = request.getHeader("HTTP_X_FORWARDED_FOR");
		}
		if (ip == null) {
			ip = request.getRemoteAddr();
		}
		return ip;
	}
	
	/*
	public static boolean hasIpAddress(List<IPManagement> ipList, String ipAddress) {
		log.info("ipList : " + ipList);
		long ip = ipToLong(ipAddress);
		Optional<IPManagement> result = ipList.stream().filter(predicate -> {
			long from = predicate.getFromIpLong();
			long to = predicate.getToIpLong();
			if (to == 0) {
				if (ip == from) {
					return true;
				}
			} else {
				if (ip >= from && ip <= to) {
					return true;
				}
			}
			return false;
		}).findFirst();
		log.info("result :" + result);
		return result.isPresent();
	}
	*/
	public static long ipToLong(String ipAddress) {
		long result = 0;
		if (ipAddress == null || "".equals(ipAddress)) {
			return result;
		}
		if ("0:0:0:0:0:0:0:1".equals(ipAddress)) {
			ipAddress = "127.0.0.1";
		}

		try {
			String[] ipAddressInArray = ipAddress.split("\\.");
			int len = ipAddressInArray.length;
			for (int i = 0; i < len; i++) {
				int power = 3 - i;
				int ip = Integer.parseInt(ipAddressInArray[i]);
				result += ip * Math.pow(256, power);
			}
		} catch (NumberFormatException e) {
			log.error("", e);
		}
		return result;
	}
	
	public static int getRandomInt(int fromNum, int toNum) {
		return (int) (Math.random() * (toNum - fromNum + 1)) + fromNum;
	}
	
}

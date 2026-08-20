package kr.co.e8ight.ndxpro.translatorbuilder.service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PublicClassNameFinder {

    public static String findPublicClassName(String javaCode) {
        // 정규 표현식을 사용하여 public class 선언을 찾기
        Pattern pattern = Pattern.compile("\\bpublic\\s+class\\s+(\\w+)");
        Matcher matcher = pattern.matcher(javaCode);
        
        // 첫 번째 매칭된 그룹(클래스 이름)을 반환
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null; // public 클래스가 없을 경우 null 반환
    }
}
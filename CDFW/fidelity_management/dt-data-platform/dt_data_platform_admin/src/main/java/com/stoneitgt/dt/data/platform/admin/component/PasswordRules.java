package com.stoneitgt.dt.data.platform.admin.component;

import java.util.regex.Pattern;

public final class PasswordRules {

    private PasswordRules() {}

    private static final Pattern LETTER = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT = Pattern.compile("\\d");
    private static final Pattern SPECIAL = Pattern.compile("[^A-Za-z0-9]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s");

    /** Passay 없이 동일 규칙(길이/영문/숫자/특수/공백금지) 검사 */
    public static boolean isValid(String password, int min, int max) {
        if (password == null) return false;
        int len = password.length();
        if (len < min || len > max) return false;
        if (!LETTER.matcher(password).find()) return false;
        if (!DIGIT.matcher(password).find()) return false;
        if (!SPECIAL.matcher(password).find()) return false;
        if (WHITESPACE.matcher(password).find()) return false;
        return true;
    }
}
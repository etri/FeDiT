package kr.co.jinwoosi.twgateway.util;

import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.ParameterizedType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public class JsonUtil {
    public static <S, T> S getObject(Class<T> tClass, String json) throws ClassNotFoundException, InvocationTargetException, NoSuchMethodException, InstantiationException, IllegalAccessException {
        if(tClass==null || json==null) return null;
        JsonParser parser = new JsonParser(json);
        Character start = parser.getFirstChar();
        if(start == null) return null;
        if(start == '[') {
            List<T> rst = _getList(tClass, parser);
            return (S)rst;
        } else if(start == '{') {
            Map<String, String> node = parser.getNextNode();
            T obj = getObject(tClass, node);
            return (S)obj;
        }
        return null;
    }
    public static <T> List<T> getList(Class<T> tClass, String json) throws NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException, ClassNotFoundException {
        JsonParser jsonParser = new JsonParser(json);
        return _getList(tClass, jsonParser);
    }

    public static Map<String,String> getMap(String json) {
        JsonParser jsonParser = new JsonParser(json);
        Map<String, String> node = jsonParser.getNextNode();
        return node;
    }

    private static <T> List<T> _getList(Class<T> tClass, JsonParser jsonParser) throws ClassNotFoundException, InvocationTargetException, NoSuchMethodException, InstantiationException, IllegalAccessException {
        List<T> rst = new ArrayList<>();
        Map<String, String> node = jsonParser.getNextNode();
        while(node != null) {
            T obj = getObject(tClass, node);
            if(obj != null) rst.add(obj);
            node = jsonParser.getNextNode();
        }

        return rst;
    }

    private static <T> T getObject(Class<T> tClass, Map<String,String> data) throws NoSuchMethodException, InvocationTargetException, InstantiationException, IllegalAccessException, ClassNotFoundException {
        if(data==null || data.isEmpty()) return null;

        T obj = tClass.getDeclaredConstructor().newInstance();
        Field[] fields = obj.getClass().getDeclaredFields();
        for(Field f : fields) {
            String val = data.get(f.getName());
            f.setAccessible(true);
            _setField(obj, f, val);
            // System.out.println(f.getName() +" : " + f.getType());
        }

        return obj;
    }

    private static void _setField(Object obj, Field f, String data) throws IllegalAccessException, InvocationTargetException, NoSuchMethodException, InstantiationException, ClassNotFoundException {
        if(f==null || data==null || data.isEmpty()) return;

        f.setAccessible(true);
        if(data.startsWith("{")) {
            JsonParser jsonParser = new JsonParser(data);
            Map<String, String> node = jsonParser.getNextNode();
            f.set(obj, getObject(Class.forName(f.getType().getTypeName()), node));
        } else if(data.startsWith("[")) {
            ParameterizedType integerListType = (ParameterizedType)f.getGenericType();
            Class<?> cls = (Class<?>)integerListType.getActualTypeArguments()[0];
            JsonParser jsonParser = new JsonParser(data);
            f.set(obj, _getList(cls, jsonParser));
        } else {
            try {
                int start = f.getType().getTypeName().lastIndexOf(".") + 1;
                String type = f.getType().getTypeName().substring(start);
                switch (type) {
                    case "String": f.set(obj, data); break;
                    case "Boolean": f.set(obj, Boolean.parseBoolean(data)); break;
                    case "Byte": f.set(obj, Byte.valueOf(data)); break;
                    case "Short": f.set(obj, Short.valueOf(data)); break;
                    case "Integer": f.set(obj, Integer.valueOf(data)); break;
                    case "Long": f.set(obj, Long.valueOf(data)); break;
                    case "Float": f.set(obj, Float.valueOf(data)); break;
                    case "Double": f.set(obj, Double.valueOf(data)); break;
                    case "BigDecimal": f.set(obj, new BigDecimal(data)); break;
                    case "LocalDate": f.set(obj, localDateValue(data)); break;
                    case "LocalDateTime": f.set(obj, localDateTimeValue(data)); break;
                    default:

                }
            } catch (Exception e) {
                f.set(obj, null);
            }
        }
    }

    public static LocalDate localDateValue(String data){
        String form = getDateFormat(data, false);
        if(form==null || form.isEmpty()) return null;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(form);
        return LocalDate.parse(data, formatter);
    }

    public static LocalDateTime localDateTimeValue(String data) {
        String form = getDateFormat(data, true);
        if(form==null || form.isEmpty()) return null;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(form);
        return LocalDateTime.parse(data, formatter);
    }

    public static String getDateFormat(String data, boolean withTime) {
        if(data==null || data.isEmpty()) return null;
        StringBuilder rst = new StringBuilder();
        String[] list = data.split(" ");
        if(list.length<2) list  = data.split("T");
        String[] mark = {"y", "M", "d", "H", "m", "s"};
        for (String str : list) {
            String[] list2 = str.split("-");
            if(list2.length > 1) {
                int start = 3 - list2.length;
                if(start < 0) break;
                if(!rst.isEmpty()) rst.append(" ");
                int idx = 0;
                for(String str2 : list2) {
                    if(idx > 0) rst.append("-");
                    rst.append(mark[start+idx++].repeat(str2.length()));
                }
            } else if(withTime) {
                list2 = str.split(":");
                int start = 3;
                int idx = 0;
                if(!rst.isEmpty()) rst.append(" ");
                for(String str2 : list2) {
                    if(idx > 0) rst.append(":");
                    rst.append(mark[start+idx++].repeat(str2.length()));
                }
            }
        }
        return rst.toString();
    }

    private static class JsonParser {
        char[] data;
        int length;
        int point;

        public JsonParser(String json) {
            this.data = null;
            this.length = 0;
            this.point = -1;
            if(json == null) return;
            this.data = json.toCharArray();
            this.length = data.length;
        }

        public Character getFirstChar() {
            for (int i=0; i<length; i++) {
                if(_isSkipChar(data[i])) continue;
                return data[i];
            }
            return null;
        }

        public Character getLastChar() {
            if(data==null) return null;
            for (int i=length-1; i>-1; i--) {
                if(_isSkipChar(data[i])) continue;
                return data[i];
            }
            return null;
        }

        private ParsStak parsStak = new ParsStak();
        public Map<String,String> getNextNode() {
            if(data==null || length-1<=point) return null;

            while (data[++point]!='{') { if(point >= length-1) return null; }
            parsStak.pushBlock('{');
            Map<String,String> rst = new HashMap<>();
            int state = 0;  // state >> 0: 변수명시작검색, 1:변수끝검색, 2:분리자검색, 3:value 시작검색, 4: value 끝검색, 5: 다음상태검색
            Character c=0;
            int start = 0;
            int end = 0;
            String name = "";
            String value = "";
            while ((c = _nextChar()) != null) {
                switch (state) {
                    case 0 : // 변수명시작검색
                        if(c=='{' || c=='[') parsStak.pushBlock(c);
                        else if(c=='}' ||  c==']') parsStak.popBlock(_endBlock(c));
                        else if(c==':') state = 3;
                        else if(c=='\'' || c=='\"') {
                            parsStak.pushBlock(c);
                            start = point+1;
                            state = 1;
                        } else {
                            parsStak.pushBlock('?');
                            start = point;
                            state = 1;
                        }
                        break;
                    case 1 :  // 변수끝검색
                         if(parsStak.curBlock() == '?') {
                             if (c == ':') {
                                 parsStak.popBlock('?');
                                 end = point - 1;
                                 state = 3;
                             }
                         }
                         else if(parsStak.curBlock()!=0) {
                            if(parsStak.curBlock() == _endBlock(c)) {
                                end = point;
                                name = _getStringName(start, end);
                                parsStak.popBlock();
                                state = 2;
                            }
                        }
                        break;
                    case 2 :  // 분리자검색
                        if(c == ':') {
                            if(end == 0) end = point-1;
                            state = 3;
                        }
                        break;
                    case 3 :  // value 시작검색
                        if(name.isEmpty()) name = _getStringName(start, end);
                        if(c=='{' || c=='[' || c=='\'' || c=='\"') parsStak.pushBlock(c);
                        else parsStak.pushBlock('?');
                        start = point;
                        if(c=='\'' || c=='\"') start++;
                        end = 0;
                        state = 4;

                        break;
                    case 4 :  // value 끝검색
                        if(parsStak.curBlock() == '?') {
                            if (c==',' || c=='}' || c==']') {
                                parsStak.popBlock('?');
                                parsStak.popBlock(_endBlock(c));
                                end = point-1;
                                value = _getString(start, end);
                                state = 5;
                            }
                        } else if(parsStak.curBlock() != 0) {
                            if(c == _endBlock(parsStak.curBlock())) {
                                parsStak.popBlock();
                                end = point;
                                if(c=='\'' || c=='\"') end--;
                                value = _getString(start, end);
                                state = 5;
                            } else if(c == parsStak.curBlock()) parsStak.pushBlock(c);
                        }
                        break;
                    case 5 :  // 다음상태검색
                        rst.put(name, value);
                        name = "";
                        value = "";
                        state = 0;
                        if (c==',' || c=='}' || c==']') {
                            parsStak.popBlock(_endBlock(c));
                        }
                        break;
                }
                if(parsStak.isEmptyBlock()) {
                    if(!name.isEmpty()) rst.put(name, value);
                    return rst;
                }
            }
            if(!name.isEmpty() && !value.isEmpty()) rst.put(name, value);
            return rst;
        }

        private Character _nextChar() {
            while (point<length-1) {
                point++;
                if(_isSkipChar(data[point])) continue;
                return data[point];
            }
            return null;
        }
        private String _getString(int start, int end) {
            if(start>=length || start>end) return "";
            if(end >= length) end = length-1;
            while(start<length && _isSkipValue(data[start])) start++;
            while(end>-1 && _isSkipValue(data[end])) end--;
            if(start>=length || start>end) return "";
            String s = new String(data, start, end-start+1);
            return new String(data, start, end-start+1);
        }

        private static char char_low_up_gap = 'a' - 'A';
        private String _getStringName(int start, int end) {
            try {
                char[] buff = _getString(start, end).toCharArray();
                if(buff.length<1) return "";

                int idx = 0;
                boolean is_b = false;
                char[] rst = new char[buff.length];
                for (char c : buff) {
                    if (c == '_') is_b = true;
                    else {
                        if (is_b) {
                            is_b = false;
                            rst[idx] = (c >= 'a' && c <= 'z') ? (char)(c - char_low_up_gap) : c;
                        } else rst[idx] = c;
                        idx++;
                    }
                }
                return new String(rst, 0, idx);
            } catch (Exception e) { return ""; }
        }

        private boolean _isSkipChar(char c) {
            return c==' ' || c=='\t' || c=='\n';
        }
        private boolean _isSkipValue(char c) {
            return c=='\'' || c=='"' ||c==',' || c=='\t' || c=='\n';
        }

        private char _endBlock(char block) {
            if(block == '\'') return '\'';
            if(block == '"') return '"';
            if(block == '{') return '}';
            if(block == '[') return ']';
            if(block == '}') return '{';
            if(block == ']') return '[';
            return 0;
        }
    }

    public static class ParsStak {
        private final char[] _buffBlock = new char[20];
        private int _curBlock = -1;
        public void pushBlock(char ch) {
            _curBlock++;
            _buffBlock[_curBlock] = ch;
        }
        public boolean isEmptyBlock() {
            return _curBlock < 0;
        }
        public void popBlock() {
            if(_curBlock > -1) _curBlock--;
        }
        public void popBlock(char ch) {
            if(curBlock()==ch) popBlock();
        }
        public char curBlock() {
            if(isEmptyBlock()) return 0;
            return _buffBlock[_curBlock];
        }
    }
}

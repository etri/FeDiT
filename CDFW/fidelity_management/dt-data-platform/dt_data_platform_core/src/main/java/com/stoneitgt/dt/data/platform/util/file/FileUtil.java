package com.stoneitgt.dt.data.platform.util.file;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;
import java.util.zip.Adler32;
import java.util.zip.CheckedOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * 파일 처리 관련 공통 클래스
 *
 * @author yh.kim
 */
@Slf4j
public class FileUtil extends FilenameUtils {

    public static final int BUFFER = 2048;

    public static boolean deleteDirectory(File dir) {
        if (!dir.exists()) {
            System.out.println("Directory does not exist.");
            return false;
        }

        if (!dir.isDirectory()) {
            System.out.println("Not a directory.");
            return false;
        }

        // 디렉토리 내부 파일 및 서브디렉토리 삭제
        File[] files = dir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    // 서브디렉토리 재귀 삭제
                    deleteDirectory(file);
                } else {
                    // 파일 삭제
                    file.delete();
                }
            }
        }

        // 디렉토리 자체 삭제
        return dir.delete();
    }

    public static void createDirectory(String dir) {
        File d = new File(dir);
        if (!d.exists()) d.mkdirs();
    }

    public static boolean existsCheckFile(String path) {
        File f = new File(path);

        if (f.exists()) {
            return true;
        } else {
            return false;
        }
    }

    public static void delete(String path) {
        File f = new File(path);
        if (f.exists()) f.delete();
    }

    public static String getUploadFilePath(String filePath, String directory, String pattern) {
        String strPattern = "";
        if (pattern == null || "".equals(pattern)) {
            strPattern = "yyyy" + File.separator + "MM" + File.separator + "dd";
        } else {
            strPattern = pattern;
        }
        SimpleDateFormat sdf = new SimpleDateFormat(strPattern);
        String yyyyMMdd = sdf.format(new Date());
        return filePath + File.separator + directory.toLowerCase() + File.separator + yyyyMMdd + File.separator;
    }

    public static String sizeOfAsString(long size) {
        final long K = 1024;
        final long M = K * K;
        final long G = M * K;
        final long T = G * K;
        final long[] dividers = new long[]{T, G, M, K, 1};
        String[] units = new String[]{"TB", "GB", "MB", "KB", "B"};
        String result = null;
        int len = dividers.length;
        for (int i = 0; i < len; i++) {
            long divider = dividers[i];
            if (size >= divider) {
                result = getFileSizeFormatter(size, divider, units[i]);
                break;
            }
        }
        return result;
    }


    public static String getFileSizeFormatter(long size, long divider, String unit) {
        double result = divider > 1 ? (double) size / (double) divider : (double) size;
        return String.format("%.1f %s", Double.valueOf(result), unit);
    }

    /**
     * 파일 생성시 동일 파일이 존재할 경우 파일 이름에 (숫자)를 붙여 파일을 생성한다
     *
     * @param filepath 대상 파일
     * @return 생성된 파일
     */
    public static File rename(String filepath) {
        File file = new File(filepath);
        // 생성된 f가 중복되지 않으면 리턴
        if (!isCreateNewFile(file)) {
            final String name = file.getName();
            String body;
            String ext;

            final int dot = name.lastIndexOf(".");
            // 확장자가 있을때
            if (dot != -1) {
                body = name.substring(0, dot);
                ext = name.substring(dot);
            } else {
                body = name;
                ext = "";
            }
            int count = 0;
            // 중복된 파일이 있을때
            // 파일이름뒤에 a숫자.확장자 이렇게 들어가게 되는데 숫자는 9999까지 된다.
            while (!isCreateNewFile(file) && count < 9999) {
                count++;
                String newName = body + "(" + count + ")" + ext;
                file = new File(file.getParent(), newName);
            }
        }
        return file;
    }

    /**
     * 새로운 파일인지 검증 여부
     *
     * @param file 대상 파일
     * @return
     */
    public static boolean isCreateNewFile(File file) {
        try {
            // 존재하는 파일이 아니면
            return file.createNewFile();
        } catch (IOException ignored) {
            return false;
        }
    }

    /**
     * 폴더안에 있는 파일들을 zip 파일로 압축을 한다.
     *
     * @param zipName 생성될 zip 파일명
     * @param target  압축 대상이 되는 디렉토리명
     * @return 압축된 zip 파일명
     */
    public static String compressZip(String zipName, String target) {

        BufferedInputStream origin = null;
        ZipOutputStream zipOutputSteam = null;
        OutputStream outputStream = null;
        try {
            outputStream = Files.newOutputStream(Paths.get(zipName));
            zipOutputSteam = new ZipOutputStream(
                    new BufferedOutputStream(new CheckedOutputStream(outputStream, new Adler32())));
            File topFile = new File(target);
            File[] subFiles = topFile.listFiles();
            if (subFiles != null) {
                for (File file : subFiles) {
                    compressZipDirectory(origin, zipOutputSteam, file, topFile.getName() + File.separator);
                }
            }
        } catch (Exception e) {
            log.error("", e);
        } finally {
            try {
                if (zipOutputSteam != null) {
                    zipOutputSteam.close();
                }
            } catch (IOException e) {
                log.error("", e);
            }
            try {
                if (outputStream != null) {
                    outputStream.close();
                }
            } catch (IOException e) {
                log.error("", e);
            }
        }

        return zipName;
    }

    public static void compressZipDirectory(BufferedInputStream origin, ZipOutputStream zout, File file,
                                            String parentPath) throws Exception {
        if (file.isDirectory()) {
            File[] files = file.listFiles();
            // 폴더이고 파일을 가지고 있는 경우 압축한다.
            if (files != null) {
                for (File f : files) {
                    compressZipDirectory(origin, zout, f, parentPath + file.getName() + File.separator);
                }
            }
            // 폴더이지만 파일을 가지고 있진 않은 경우 폴더 자체만 압축한다.
            else {
                try {
                    ZipEntry entry = new ZipEntry(parentPath + file.getName() + File.separator);
                    zout.putNextEntry(entry);
                } catch (IOException e) {
                    log.error("", e);

                } finally {
                    try {
                        if (origin != null) {
                            origin.close();
                        }
                    } catch (IOException e) {
                        log.error("", e);
                    }
                }
            }
        } else {
            // 파일인 경우 압축
            // 원하는 만큼의 상위경로를 포함 시켜 압축해 줘야 함. --> parentPath
            BufferedInputStream newOrigin = null;
            try {
                byte data[] = new byte[BUFFER];
                newOrigin = new BufferedInputStream(Files.newInputStream(Paths.get(file.getAbsolutePath())), BUFFER);
                // 해당 폴더명아래로 압축할 경우 parentPath가 필요
                // ZipEntry entry = new ZipEntry(parentPath + file.getName());
                // 폴더없이 파일만 압축할 경우에는 해당 파일명만 넣어준다.
                ZipEntry entry = new ZipEntry(file.getName());
                zout.putNextEntry(entry);
                int count;
                while ((count = origin.read(data, 0, BUFFER)) != -1) {
                    zout.write(data, 0, count);
                }
            } catch (IOException e) {
                log.error("", e);
            } finally {
                try {
                    if (newOrigin != null) {
                        newOrigin.close();
                    }
                } catch (IOException e) {
                    log.error("", e);
                }
            }
        }
    }

    public static String encodeFileToBase64Binary(String fileName) throws IOException {
        String encodedBase64 = null;
        InputStream is = null;
        try {
            is = Files.newInputStream(Paths.get(fileName));
            byte[] bytes = IOUtils.toByteArray(is);
            is.read(bytes);
            encodedBase64 = new String(Base64.encodeBase64(bytes));
        } catch (FileNotFoundException e) {
            log.error("", e);
        } catch (IOException e) {
            log.error("", e);
        } finally {
            try {
                if (is != null)
                    is.close();
            } catch (IOException e) {
                log.error("", e);
            }
        }
        return encodedBase64;
    }

    /*public static String getFileContentType(File file) {
//		return new MimetypesFileTypeMap().getContentType(file);
        Tika tika = new Tika();
        String mimeType = "";
        try {
            mimeType = tika.detect(file);
        } catch (IOException e) {
            log.error("", e);
        }
        return mimeType;
    }*/

    public static File multipartToFile(MultipartFile multipart) throws IllegalStateException, IOException {
        String filename = multipart.getOriginalFilename();
        if (filename != null) {
            File file = new File(UUID.randomUUID().toString());
            multipart.transferTo(file);
            return file;
        }
        return null;
    }

    /*public static String getContentType(MultipartFile multipart) throws IllegalStateException, IOException {
        return getFileContentType(multipartToFile(multipart));
    }*/

    public static String getFileExtension(String filename) {
        String extension = FilenameUtils.getExtension(filename);
        return extension != null ? extension.toLowerCase() : null;
    }

    public static String getUploadFilePath(String directory) {
        return getUploadFilePath(directory, "");
    }

    public static String getUploadDtFilePath(String directory, int modelSeq) {
        return getUploadDtFilePath(directory, modelSeq, "");
    }

    public static String getUploadDtFilePath(String directory, int modelSeq, String pattern) {
        String strPattern = "";
        if (pattern == null || "".equals(pattern)) {
            strPattern = "yyyyMM";
        } else {
            strPattern = pattern;
        }
        SimpleDateFormat sdf = new SimpleDateFormat(strPattern);
        String yyyyMM = sdf.format(new Date());
		
		/*
		SimpleDateFormat sdf = new SimpleDateFormat("yyyyMM");
		String yyyyMM = sdf.format(new Date());
		
		log.info(yyyyMM.substring(0,4));
		log.info(yyyyMM.substring(4,6));
		*/
        return "/" + directory.toLowerCase() + "/" + yyyyMM.substring(0, 4) + "/" + yyyyMM.substring(4, 6) + "/" + modelSeq + "/";
    }

    public static String getUploadFilePath(String directory, String pattern) {
        String strPattern = "";
        if (pattern == null || "".equals(pattern)) {
            strPattern = "yyyy/MM/dd";
        } else {
            strPattern = pattern;
        }
        SimpleDateFormat sdf = new SimpleDateFormat(strPattern);
        String yyyyMMdd = sdf.format(new Date());
        return "/" + directory.toLowerCase() + "/" + yyyyMMdd + "/";
    }

    public static String getDownloadFileName(String filename, String agent) {
        String header = agent.toLowerCase();
        String encodedFilename = "";
//		log.info("file name : " + filename);
//		log.info("header : " + header);
        try {
            if (header.contains("msie") || header.contains("trident") || header.contains("firefox")) {
                encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8.name()).replaceAll("\\+", "%20");
            } else if (header.contains("chrome")) {
                StringBuffer sb = new StringBuffer();
                for (int i = 0; i < filename.length(); i++) {
                    char c = filename.charAt(i);
                    if (c > '~') {
                        sb.append(URLEncoder.encode("" + c, StandardCharsets.UTF_8.name()));
                    } else {
                        sb.append(c);
                    }
                }
                encodedFilename = "\"" + sb.toString() + "\"";
            } else {
                encodedFilename = "\""
                        + new String(filename.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1) + "\"";
                encodedFilename = URLEncoder.encode(encodedFilename, StandardCharsets.UTF_8.name()).replaceAll("\\+",
                        "%20");
            }
        } catch (Exception e) {
            log.error("", e);
            encodedFilename = filename;
        }

        if (log.isInfoEnabled()) {
            log.info("encoded file name : " + encodedFilename);
        }

        return encodedFilename;
    }

    /*public static String getContentType(File file) throws IOException {
        return new Tika().detect(file);
    }*/

    /*public static String getContentType(InputStream is) throws IOException {
        return new Tika().detect(is);
    }*/

    public static File uploadFile(String filepath, MultipartFile source) throws IOException {
        File file = new File(filepath);
        FileUtils.forceMkdirParent(file);

        FileUtils.copyInputStreamToFile(source.getInputStream(), file);

        return file;
    }

    public static File uploadFile(String filepath, String filename, MultipartFile source) throws IOException {
        File file = new File(filepath);
        FileUtils.forceMkdirParent(file);

        FileUtils.copyInputStreamToFile(source.getInputStream(), new File(filepath + filename));

        return file;
    }

    public static void outputStreamFile(File file, String filename, HttpServletResponse response,
                                        HttpServletRequest request) throws IOException {
        outputStreamFile(file, filename, null, response, request);
    }

    public static void outputStreamFile(File file, String filename, File directory, HttpServletResponse response,
                                        HttpServletRequest request) {

        if (file == null || !file.exists()) {
            return;
        }

        try {
            if (StringUtils.isBlank(response.getContentType())) {
                response.setContentType(detectContentType(file)); // getContentType(file) 대체
            }

            String encodeFilename = encodeFilename(filename, request);
            response.setHeader("Content-Disposition", "attachment; filename=\"" + encodeFilename + "\"");
            response.setContentLength((int) file.length());

            try (InputStream inputStream = Files.newInputStream(Paths.get(file.getAbsolutePath()))) {
                FileCopyUtils.copy(inputStream, response.getOutputStream());
            }

            if (directory != null) {
                // 압축 디렉토리 삭제
                FileUtils.deleteDirectory(directory);
                // 압축 파일 삭제
                FileUtils.forceDelete(file);
            }
        } catch (IOException e) {
            log.error(e.getMessage());
        }
    }

    public static String encodeFilename(String filename, HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        BrowserGroup group = detectBrowserGroup(ua);
        return FileNameEncoder.encode(group, filename);
    }

    enum BrowserGroup {IE, CHROMIUM, FIREFOX, SAFARI, OPERA, UNKNOWN}

    static BrowserGroup detectBrowserGroup(String ua) {
        String s = ua == null ? "" : ua.toLowerCase();
        if (s.contains("trident") || s.contains("msie")) return BrowserGroup.IE;
        if (s.contains("edg") || s.contains("chrome") || s.contains("chromium") || s.contains("crios"))
            return BrowserGroup.CHROMIUM;
        if (s.contains("firefox")) return BrowserGroup.FIREFOX;
        if (s.contains("opera") || s.contains("opr")) return BrowserGroup.OPERA;
        if (s.contains("safari")) return BrowserGroup.SAFARI;
        return BrowserGroup.UNKNOWN;
    }

    private enum FileNameEncoder {
        IE(BrowserGroup.IE, it -> {
            try {
                return URLEncoder.encode(it, StandardCharsets.UTF_8.name()).replaceAll("\\+", "%20");
            } catch (UnsupportedEncodingException e) {
                return it;
            }
        }),
        FIREFOX(BrowserGroup.FIREFOX, getDefaultEncodeOperator()),
        OPERA(BrowserGroup.OPERA, getDefaultEncodeOperator()),
        CHROMIUM(BrowserGroup.CHROMIUM, getDefaultEncodeOperator()),
        SAFARI(BrowserGroup.SAFARI, getDefaultEncodeOperator()),
        UNKNOWN(BrowserGroup.UNKNOWN, UnaryOperator.identity());

        private final BrowserGroup browser;
        private final UnaryOperator<String> encodeOperator;

        private static final Map<BrowserGroup, Function<String, String>> FILE_NAME_ENCODER_MAP;

        static {
            FILE_NAME_ENCODER_MAP = EnumSet.allOf(FileNameEncoder.class).stream()
                    .collect(Collectors.toMap(FileNameEncoder::getBrowser, FileNameEncoder::getEncodeOperator));
        }

        FileNameEncoder(BrowserGroup browser, UnaryOperator<String> encodeOperator) {
            this.browser = browser;
            this.encodeOperator = encodeOperator;
        }

        protected BrowserGroup getBrowser() {
            return browser;
        }

        protected UnaryOperator<String> getEncodeOperator() {
            return encodeOperator;
        }

        private static UnaryOperator<String> getDefaultEncodeOperator() {
            // 크롬/파폭/사파리/오페라: ISO-8859-1로 바이트 캐스팅
            return it -> new String(it.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);
        }

        public static String encode(BrowserGroup browser, String fileName) {
            Function<String, String> f = FILE_NAME_ENCODER_MAP.get(browser);
            return (f != null) ? f.apply(fileName) : fileName;
        }
    }

    public static String formatFileSize(long fileSize) {
        if (fileSize < 1024) return fileSize + " B";
        int exp = (int) (Math.log(fileSize) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "B";
        return String.format("%.1f %s", fileSize / Math.pow(1024, exp), pre);
    }

    public static String getExtractFileNameToFilePath(String filePath) {
        // 마지막 '/'의 인덱스를 찾습니다.
        int lastSlashIndex = filePath.lastIndexOf('/');

        if (lastSlashIndex != -1) {
            // 마지막 '/' 이후의 문자열 (파일명 + 확장자)을 추출합니다.
            String fileNameWithExtension = filePath.substring(lastSlashIndex + 1);
            return fileNameWithExtension;
        } else {
            // '/'가 없는 경우 전체 경로가 파일명 + 확장자라고 가정합니다.
            System.out.println(filePath);
            return filePath;
        }
    }

    private static String detectContentType(File file) {
        final String DEFAULT = "application/octet-stream";

        if (file == null || !file.exists()) {
            return DEFAULT;
        }

        final Path path = file.toPath();

        // 1) OS/JDK 연동 MIME 탐지 (가장 우선)
        try {
            String type = Files.probeContentType(path);
            if (StringUtils.isNotBlank(type)) {
                return type;
            }
        } catch (IOException ignored) {
        }

        // 2) 이름/내용 기반 JDK 추측 (가벼운 휴리스틱)
        try {
            String typeByName = URLConnection.guessContentTypeFromName(file.getName());
            if (StringUtils.isNotBlank(typeByName)) {
                return typeByName;
            }
        } catch (Exception ignored) {
        }

        // (선택) 내용 기반은 스트림을 여니 비용/부작용이 싫다면 주석 처리 가능
        try (InputStream is = Files.newInputStream(path)) {
            String typeByStream = URLConnection.guessContentTypeFromStream(is);
            if (StringUtils.isNotBlank(typeByStream)) {
                return typeByStream;
            }
        } catch (IOException ignored) {
        }

        // 3) 확장자 매핑 폴백 (경량 사전)
        String ext = FilenameUtils.getExtension(file.getName());
        if (ext != null) {
            ext = ext.toLowerCase(Locale.ROOT);
            String mapped = EXT_TO_MIME.get(ext);
            if (mapped != null) {
                return mapped;
            }
        }

        return DEFAULT;
    }

    /**
     * 최소필수 확장자 매핑(원하시면 계속 추가 가능)
     */
    private static final Map<String, String> EXT_TO_MIME = new HashMap<String, String>() {{
        // text
        put("txt", "text/plain");
        put("csv", "text/csv");
        put("tsv", "text/tab-separated-values");
        put("html", "text/html");
        put("htm", "text/html");
        put("css", "text/css");
        put("js", "application/javascript");
        put("json", "application/json");
        put("xml", "application/xml");

        // images
        put("png", "image/png");
        put("jpg", "image/jpeg");
        put("jpeg", "image/jpeg");
        put("gif", "image/gif");
        put("bmp", "image/bmp");
        put("webp", "image/webp");
        put("svg", "image/svg+xml");
        put("ico", "image/x-icon");

        // documents
        put("pdf", "application/pdf");
        put("rtf", "application/rtf");
        put("md", "text/markdown");

        // MS Office OOXML
        put("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        put("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        put("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");

        // MS Office (legacy)
        put("doc", "application/msword");
        put("xls", "application/vnd.ms-excel");
        put("ppt", "application/vnd.ms-powerpoint");

        // archives
        put("zip", "application/zip");
        put("gz", "application/gzip");
        put("tar", "application/x-tar");
        put("7z", "application/x-7z-compressed");
        put("rar", "application/vnd.rar");

        // fonts
        put("ttf", "font/ttf");
        put("otf", "font/otf");
        put("woff", "font/woff");
        put("woff2", "font/woff2");

        // audio
        put("mp3", "audio/mpeg");
        put("wav", "audio/wav");
        put("ogg", "audio/ogg");
        put("m4a", "audio/mp4");

        // video
        put("mp4", "video/mp4");
        put("webm", "video/webm");
        put("ogv", "video/ogg");
        put("mov", "video/quicktime");
        put("avi", "video/x-msvideo");
    }};
}



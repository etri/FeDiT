package kr.co.e8ight.ndxpro.fileservice.service;

import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileErrorCode;
import kr.co.e8ight.ndxpro.fileservice.config.exceptions.FileException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.DirectoryStream;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.PosixFileAttributeView;
import java.nio.file.attribute.PosixFileAttributes;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.UUID;

@Service
@Slf4j
public class FileIoService {

    /** 저장하는 파일 퍼미션. 같은 그룹의 다른 서비스가 수정할 수 있도록 그룹 쓰기를 허용한다. */
    private static final String FILE_PERMISSIONS = "rw-rw-r--";

    /** 저장하는 디렉터리 퍼미션. */
    private static final String DIRECTORY_PERMISSIONS = "rwxrwxr-x";

    @Value("${file-service.dir}")
    private String baseDir;

    @Value("${file-service.copy-dir}")
    private String copyDir;

    /**
     * 물리 경로를 파일 저장 루트(file-service.dir) 기준으로 해석해 실제 경로를 돌려준다.
     * 절대 경로와 루트 기준 상대 경로를 모두 허용하되,
     * 상위 경로 참조(../)나 심볼릭 링크로 루트 밖을 벗어나는 경로는 거부한다.
     */
    public Path resolvePathInBaseDir(String path) {
        Path base = Paths.get(baseDir).toAbsolutePath().normalize();
        Path resolved = resolveUnder(base, path);

        refreshAttributeCache(resolved);

        try {
            Path real = resolved.toRealPath();

            if ( !real.startsWith(base.toRealPath()) ) {
                throw new FileException(ErrorCode.BAD_REQUEST_DATA, "file path is out of the allowed directory.");
            }

            if ( !Files.isRegularFile(real) ) {
                throw new FileException(ErrorCode.RESOURCE_NOT_FOUND, "file not found. " + path);
            }

            return real;
        } catch (IOException e) {
            throw new FileException(ErrorCode.RESOURCE_NOT_FOUND, "file not found. " + path);
        }
    }

    /**
     * 파일을 읽기 전에 부모 디렉터리를 한 번 훑어 파일시스템의 속성 캐시를 갱신한다.
     * 공유 볼륨(NFS 등)에서 다른 서비스가 수정한 내용이 곧바로 보이지 않는 것을 막기 위한 것으로,
     * 셸에서 읽기 전에 ls를 실행하는 것과 같은 효과를 낸다. 실패해도 읽기는 그대로 진행한다.
     */
    private void refreshAttributeCache(Path file) {
        Path parent = file.getParent();

        if ( parent == null ) {
            return;
        }

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(parent)) {
            for (Path ignored : stream) {
                // 디렉터리 엔트리를 실제로 읽어야 캐시가 갱신되므로 순회만 한다.
            }
        } catch (IOException | SecurityException e) {
            log.warn("can not refresh attribute cache of {} : {}", parent, e.toString());
        }
    }

    /**
     * 저장된 파일을 사본 디렉터리(file-service.copy-dir) 하위로 복사한다.
     * targetPath는 사본 디렉터리 기준 상대 경로 또는 그 하위의 절대 경로만 허용한다.
     */
    public Path copyFileToCopyDir(Path source, String targetPath, boolean overwrite) {
        Path target = resolveUnder(Paths.get(copyDir).toAbsolutePath().normalize(), targetPath);

        if ( Files.isDirectory(target) ) {
            throw new FileException(ErrorCode.BAD_REQUEST_DATA, "target path is a directory. " + targetPath);
        }

        if ( !overwrite && Files.exists(target) ) {
            throw new FileException(ErrorCode.ALREADY_EXISTS, "target file already exists. " + targetPath);
        }

        try {
            createDirectoriesWithOwnerOf(target.getParent(), source);

            if ( overwrite ) {
                Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES);
            } else {
                Files.copy(source, target, StandardCopyOption.COPY_ATTRIBUTES);
            }

            applySourceAttributes(source, target);

            log.info("copied physical file : {} -> {} ({})", source, target, describeAttributes(target));
            return target;
        } catch (FileAlreadyExistsException e) {
            throw new FileException(ErrorCode.ALREADY_EXISTS, "target file already exists. " + targetPath);
        } catch (IOException e) {
            throw new FileException(FileErrorCode.FILE_IO_ERROR, "file copy failed. " + e.getMessage());
        }
    }

    /**
     * 사본 디렉터리(file-service.copy-dir) 바로 아래에 UUID 이름의 빈 디렉터리를 만든다.
     */
    public Path createTmpDir() {
        Path root = Paths.get(copyDir).toAbsolutePath().normalize();
        Path dir = root.resolve(UUID.randomUUID().toString());

        try {
            Files.createDirectories(root);
            Files.createDirectory(dir);

            log.info("created tmp directory : {} ({})", dir, describeAttributes(dir));
            return dir;
        } catch (IOException e) {
            throw new FileException(FileErrorCode.FILE_IO_ERROR, "tmp directory create failed. " + e);
        }
    }

    /**
     * 사본 디렉터리(file-service.copy-dir) 바로 아래 하위 디렉터리의 내용을 비운다.
     * 하위 디렉터리 자체는 남겨두며, 사본 루트나 더 깊은 경로는 대상으로 받지 않는다.
     * 심볼릭 링크는 따라가지 않는다.
     */
    public Path deleteCopyDir(String name) {
        Path root = Paths.get(copyDir).toAbsolutePath().normalize();
        Path dir = resolveUnder(root, name);

        if ( !root.equals(dir.getParent()) ) {
            throw new FileException(ErrorCode.BAD_REQUEST_DATA, "invalid copy directory. " + name);
        }

        refreshAttributeCache(dir);

        if ( !Files.isDirectory(dir, LinkOption.NOFOLLOW_LINKS) ) {
            throw new FileException(ErrorCode.RESOURCE_NOT_FOUND, "copy not found. " + name);
        }

        try {
            Files.walkFileTree(dir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path d, IOException e) throws IOException {
                    if ( e != null ) {
                        throw e;
                    }
                    // 대상 디렉터리 자체는 남기고, 그 안의 하위 디렉터리만 지운다.
                    if ( !d.equals(dir) ) {
                        Files.delete(d);
                    }
                    return FileVisitResult.CONTINUE;
                }
            });

            log.info("cleared copy directory : {}", dir);
            return dir;
        } catch (IOException e) {
            throw new FileException(FileErrorCode.FILE_IO_ERROR, "copy delete failed. " + e);
        }
    }

    /**
     * 없는 디렉터리를 만들면서, 새로 만든 디렉터리의 소유자/그룹을 원본 파일과 맞춘다.
     * 사본을 원본과 같은 계정이 다룰 수 있도록 하기 위한 것으로, 실패해도 복사는 계속 진행한다.
     */
    private void createDirectoriesWithOwnerOf(Path dir, Path source) throws IOException {
        Deque<Path> created = new ArrayDeque<>();

        for (Path p = dir; p != null && !Files.exists(p); p = p.getParent()) {
            created.push(p);
        }

        Files.createDirectories(dir);
        created.forEach(p -> copyOwner(source, p));
    }

    /**
     * 원본 파일의 퍼미션과 소유자/그룹을 대상에 적용한다.
     * COPY_ATTRIBUTES가 적용되지 않는 파일시스템을 위해 퍼미션도 명시적으로 다시 설정한다.
     */
    private void applySourceAttributes(Path source, Path target) {
        try {
            Files.setPosixFilePermissions(target, Files.readAttributes(source, PosixFileAttributes.class).permissions());
        } catch (IOException | UnsupportedOperationException | SecurityException e) {
            log.warn("can not apply source file permissions to {} : {}", target, e.toString());
        }

        copyOwner(source, target);
    }

    /**
     * 대상 파일의 현재 퍼미션과 소유자/그룹을 로그용 문자열로 만든다.
     */
    private String describeAttributes(Path path) {
        try {
            PosixFileAttributes attributes = Files.readAttributes(path, PosixFileAttributes.class);
            return PosixFilePermissions.toString(attributes.permissions())
                    + " " + attributes.owner().getName() + ":" + attributes.group().getName();
        } catch (IOException | UnsupportedOperationException | SecurityException e) {
            return "unknown attributes : " + e;
        }
    }

    /**
     * 원본 파일의 소유자/그룹을 대상에 적용한다.
     * 소유자 변경은 root 권한이 필요하므로, 실패하면 경고만 남기고 넘어간다.
     */
    private void copyOwner(Path source, Path target) {
        try {
            PosixFileAttributes attributes = Files.readAttributes(source, PosixFileAttributes.class);
            PosixFileAttributeView view = Files.getFileAttributeView(target, PosixFileAttributeView.class);

            if ( view == null ) {
                log.warn("posix file attribute view is not supported. {}", target);
                return;
            }

            view.setOwner(attributes.owner());
            view.setGroup(attributes.group());
        } catch (IOException | UnsupportedOperationException | SecurityException e) {
            log.warn("can not apply source file owner to {} : {}", target, e.toString());
        }
    }

    /**
     * 입력 경로를 지정한 루트 기준으로 해석한다.
     * 절대 경로와 루트 기준 상대 경로를 모두 허용하되, 루트를 벗어나는 경로는 거부한다.
     * (심볼릭 링크 검사는 실제 파일이 존재하는 경우에만 호출한 쪽에서 추가로 수행한다.)
     */
    private Path resolveUnder(Path base, String path) {
        if ( path == null || path.isBlank() ) {
            throw new FileException(ErrorCode.BAD_REQUEST_DATA, "file path is empty.");
        }

        Path input = Paths.get(path);
        Path resolved = ( input.isAbsolute() ? input : base.resolve(input) ).normalize();

        if ( !resolved.startsWith(base) ) {
            throw new FileException(ErrorCode.BAD_REQUEST_DATA, "file path is out of the allowed directory.");
        }

        return resolved;
    }

    public Resource getFileResourceFromFilePath(String path) {
        Path filePath = Paths.get(path);
        try {
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "file not found or not readable.");
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new FileException(ErrorCode.INTERNAL_SERVER_ERROR, "malformed resource url. " + e.getMessage());
        }
    }

    public void writeFile(String path, MultipartFile multipartFile) throws IOException {
        File file = new File(path);
        log.info("start write physical file : {}", file.getAbsolutePath());
        Path target = Path.of(file.getAbsolutePath());

        createDirectoriesWithPermissions(target.getParent());
        multipartFile.transferTo(target);
        applyPermissions(target, FILE_PERMISSIONS);
    }

    /**
     * 없는 디렉터리를 만들고, 새로 만든 디렉터리에 그룹 쓰기 권한을 준다.
     * /data를 공유하는 다른 서비스(SMB 등)가 같은 그룹으로 접근할 수 있게 하기 위한 것이다.
     */
    private void createDirectoriesWithPermissions(Path dir) throws IOException {
        if ( dir == null ) {
            return;
        }

        Deque<Path> created = new ArrayDeque<>();

        for (Path p = dir; p != null && !Files.exists(p); p = p.getParent()) {
            created.push(p);
        }

        Files.createDirectories(dir);
        created.forEach(p -> applyPermissions(p, DIRECTORY_PERMISSIONS));
    }

    /**
     * 파일이나 디렉터리의 퍼미션을 지정한 값으로 맞춘다.
     * umask에 의존하지 않고 환경과 무관하게 같은 퍼미션을 갖게 하려는 것으로,
     * 실패해도 경고만 남기고 넘어간다.
     */
    private void applyPermissions(Path path, String permissions) {
        try {
            Files.setPosixFilePermissions(path, PosixFilePermissions.fromString(permissions));
        } catch (IOException | UnsupportedOperationException | SecurityException e) {
            log.warn("can not apply permissions {} to {} : {}", permissions, path, e.toString());
        }
    }

    public String getChecksumFromMultipartFile(MultipartFile multipartFile) {
        byte[] b;
        try (InputStream fis = multipartFile.getInputStream()) {
            b = createChecksum(fis);
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
        StringBuilder result = new StringBuilder();

        for (int i=0; i < b.length; i++) {
            result.append(Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1));
        }
        return result.toString();
    }

    public String getChecksumFromFilePath(String path) {
        byte[] b;
        try (InputStream fis = new FileInputStream(path)) {
            b = createChecksum(fis);
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
        StringBuilder result = new StringBuilder();

        for (int i=0; i < b.length; i++) {
            result.append(Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1));
        }
        return result.toString();
    }

    public byte[] createChecksum(InputStream inputStream) throws NoSuchAlgorithmException, IOException {
        byte[] buffer = new byte[1024];
        MessageDigest complete = MessageDigest.getInstance("MD5");
        int numRead;

        do {
            numRead = inputStream.read(buffer);
            if (numRead > 0) {
                complete.update(buffer, 0, numRead);
            }
        } while (numRead != -1);

        return complete.digest();
    }
}

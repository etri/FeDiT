package kr.co.e8ight.ndxpro.translatorbuilder.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import kr.co.e8ight.ndxpro.translatorbuilder.domain.ProcessingResult;
import kr.co.e8ight.ndxpro.translatorbuilder.dto.TranslatorCompileRequestDto;
import kr.co.e8ight.ndxpro.translatorbuilder.dto.TranslatorRegisterDto;
import kr.co.e8ight.ndxpro.translatorbuilder.dto.ProcessResultDto;
import kr.co.e8ight.ndxpro.translatorbuilder.exception.BuildTranslatorException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
@Slf4j
public class BuildService {

    private final FileService fileService;

    @Value("${translator.dir}")
    private String translatorDir;

    @Value("${translator.path}")
    private String translatorPath;

    public synchronized ProcessResultDto compile(TranslatorCompileRequestDto translatorCompileRequestDto) {
        log.info("compile start.");

        log.debug("save Translator class.");
        String publicClassName = PublicClassNameFinder.findPublicClassName(translatorCompileRequestDto.getTranslateCode());
        fileService.saveOrReplaceFile(translatorPath + "/" + publicClassName + ".java", translatorCompileRequestDto.getTranslateCode());

        log.debug(translatorDir +"/gradlew compileJava.");
        ProcessResultDto processResultDto = gradleCompileTest(publicClassName);

        log.info("compile completed.");
        return processResultDto;
    }

    public synchronized ProcessResultDto build(TranslatorRegisterDto translatorRegisterDto) {
        log.info("build start.");

        log.debug("save Translator class.");
        String publicClassName = PublicClassNameFinder.findPublicClassName(translatorRegisterDto.getTranslateCode());
        fileService.saveOrReplaceFile(translatorPath + "/" + publicClassName + ".java", translatorRegisterDto.getTranslateCode());

        ProcessResultDto buildResult = gradleBuild(publicClassName);
        String jarTargetPath = moveJarFile(publicClassName);
        removeClassFile(publicClassName);

        buildResult.setSavedFilePath(jarTargetPath);
        Path path = Paths.get(buildResult.getSavedFilePath());

        try (InputStream inputStream = Files.newInputStream(path)) {
            byte[] bytes = inputStream.readAllBytes();
            buildResult.setSavedFile(bytes);
        } catch (IOException e) {
            throw new BuildTranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
        log.info("build completed.");
        return buildResult;
    }

    private void removeClassFile(String name) {
        log.debug("remove translator class. : " + name + ".java");
        ProcessingResult result = run("rm", translatorPath + "/" + name + ".java");
        if ( result.getExitCode() != 0 ) {
            throw new BuildTranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, result.getError());
        }
    }

    private String moveJarFile(String publicClassName) {
        String sourcePath = translatorDir + "/build/libs/translator.jar";
        String targetPath = translatorDir + "/translatorJars/" + publicClassName + ".jar";

        log.debug("move jar {} to {}", sourcePath, targetPath);

        ProcessingResult result = run("mv", sourcePath, targetPath);
        if ( result.getExitCode() != 0 ) {
            removeClassFile(publicClassName);
            throw new BuildTranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, result.getError());
        }

        return targetPath;
    }

    private ProcessResultDto gradleCompileTest(String publicClassName) {
        log.info("gradle compileTest.");
        ProcessingResult result = run(translatorDir + "/gradlew", "compileTest", "--no-build-cache", "-p", translatorDir);
        return new ProcessResultDto(result.getExitCode(), result.getOutput(), result.getError());
    }

    private ProcessResultDto gradleBuild(String publicClassName) {
        log.debug("gradle build.");
        ProcessingResult result = run(translatorDir + "/gradlew", "build", "--no-build-cache", "-p", translatorDir);

        if ( result.getExitCode() != 0 ) {
            removeClassFile(publicClassName);
            throw new BuildTranslatorException(ErrorCode.BAD_REQUEST_DATA, result.getError());
        }
        return new ProcessResultDto(result.getExitCode(), result.getOutput(), result.getError());
    }

    private static void readStream(InputStream inputStream, StringBuilder output) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }
    }

    private ProcessingResult run(String... command) {
        try {
            log.debug("run command : {}", (Object[]) command);
            ProcessBuilder processBuilder = new ProcessBuilder(command);

            Process process = processBuilder.start();

            StringBuilder output = new StringBuilder();
            StringBuilder error = new StringBuilder();

            Thread outputThread = new Thread(() -> {
                try {
                    readStream(process.getInputStream(), output);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });

            Thread errorThread = new Thread(() -> {
                try {
                    readStream(process.getErrorStream(), error);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });

            // 스레드를 시작하여 출력을 읽어옵니다.
            outputThread.start();
            errorThread.start();

            // 프로세스가 종료될 때까지 대기합니다.
            int exitCode = process.waitFor();
            outputThread.join();
            errorThread.join();

            log.debug("exit code : {}", exitCode);
            return new ProcessingResult(exitCode, output.toString(), error.toString());
        } catch (InterruptedException | IOException e) {
            throw new BuildTranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    private String inputStreamToString(InputStream inputStream) {
        StringBuilder stringBuilder = new StringBuilder();
        try (Reader reader = new BufferedReader(new InputStreamReader
                (inputStream, StandardCharsets.UTF_8))) {
            int c;
            while ((c = reader.read()) != -1) {
                stringBuilder.append((char) c);
            }
        } catch (IOException e) {
            throw new BuildTranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, e.getMessage());
        }
        return stringBuilder.toString();
    }
}

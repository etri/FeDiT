package kr.co.e8ight.ndxpro.translatorbuilder.service;

import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
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
        fileService.saveOrReplaceFile(translatorPath + "/" + translatorCompileRequestDto.getName() + ".java", translatorCompileRequestDto.getTranslateCode());

        log.debug(translatorDir +"/gradlew compileJava.");
        ProcessResultDto processResultDto = gradleCompileTest(translatorCompileRequestDto);

        log.info("compile completed.");
        return processResultDto;
    }

    public synchronized ProcessResultDto build(TranslatorRegisterDto translatorRegisterDto) {
        log.info("build start.");

        log.debug("save Translator class.");
        fileService.saveOrReplaceFile(translatorPath + "/" + translatorRegisterDto.getName() + ".java", translatorRegisterDto.getTranslateCode());

        ProcessResultDto buildResult = gradleBuild(translatorRegisterDto);
        String jarTargetPath = moveJarFile(translatorRegisterDto);
        removeClassFile(translatorRegisterDto.getName());

        buildResult.setSavedFilePath(jarTargetPath);
        Path path = Paths.get(buildResult.getSavedFilePath());

        try {
            InputStream inputStream = Files.newInputStream(path);
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
        Process remove = run("rm " + translatorPath + "/" + name + ".java");
        if ( remove.exitValue() != 0 ) {
            throw new BuildTranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, inputStreamToString(remove.getErrorStream()));
        }
    }

    private String moveJarFile(TranslatorRegisterDto translatorRegisterDto) {
        String sourcePath = translatorDir + "/build/libs/translator.jar";
        String targetPath = translatorDir + "/translatorJars/" + translatorRegisterDto.getName() + ".jar";

        log.debug("move jar." + sourcePath + " to " + targetPath);

        Process move = run("mv " + sourcePath + " " + targetPath);
        if ( move.exitValue() != 0 ) {
            removeClassFile(translatorRegisterDto.getName());
            throw new BuildTranslatorException(ErrorCode.INTERNAL_SERVER_ERROR, inputStreamToString(move.getErrorStream()));
        }

        return targetPath;
    }

    private ProcessResultDto gradleCompileTest(TranslatorCompileRequestDto translatorCompileRequestDto) {
        log.debug("gradle compileTest.");

        Process build = run(translatorDir + "/gradlew compileTest --no-build-cache -p " + translatorDir);
        removeClassFile(translatorCompileRequestDto.getName());
        if ( build.exitValue() != 0 ) {
            return new ProcessResultDto(build.exitValue(), inputStreamToString(build.getInputStream()), inputStreamToString(build.getErrorStream()));
        } else {
            return new ProcessResultDto(build.exitValue(), inputStreamToString(build.getInputStream()));
        }
    }

    private ProcessResultDto gradleBuild(TranslatorRegisterDto translatorRegisterDto) {
        log.debug("gradle build.");

        Process build = run(translatorDir + "/gradlew build --no-build-cache -p " + translatorDir);
        if ( build.exitValue() != 0 ) {
            removeClassFile(translatorRegisterDto.getName());
            throw new BuildTranslatorException(ErrorCode.BAD_REQUEST_DATA, inputStreamToString(build.getErrorStream()));
        }
        return new ProcessResultDto(build.exitValue(), inputStreamToString(build.getInputStream()));
    }

    private Process run(String command) {
        try {
            Process process = Runtime.getRuntime().exec(command);
            process.waitFor();
            return process;
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

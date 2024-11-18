package kr.co.e8ight.ndxpro.agentManager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.e8ight.ndxpro.agentManager.exceptions.BuildErrorResult;
import kr.co.e8ight.ndxpro.agentManager.exceptions.HttpRequestFailedException;
import kr.co.e8ight.ndxpro.common.exception.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.ResponseErrorHandler;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
public class HttpErrorHandler implements ResponseErrorHandler {

    private final ObjectMapper objectMapper;

    @Override
    public boolean hasError(ClientHttpResponse response) throws IOException {
        return response.getStatusCode().series() == HttpStatus.Series.CLIENT_ERROR ||
                response.getStatusCode().series() == HttpStatus.Series.SERVER_ERROR;
    }

    @Override
    public void handleError(ClientHttpResponse response) throws IOException {
        if (response.getStatusCode()
                .series() == HttpStatus.Series.SERVER_ERROR) {
            StringBuilder stringBuilder = new StringBuilder();
            try (Reader reader = new BufferedReader(new InputStreamReader
                    (response.getBody(), StandardCharsets.UTF_8))) {
                int c = 0;
                while ((c = reader.read()) != -1) {
                    stringBuilder.append((char) c);
                }
            }
            BuildErrorResult buildErrorResult = objectMapper.readValue(stringBuilder.toString(), BuildErrorResult.class);
            throw new HttpRequestFailedException(ErrorCode.INTERNAL_SERVER_ERROR, buildErrorResult.getDetail());
        } else if (response.getStatusCode()
                .series() == HttpStatus.Series.CLIENT_ERROR) {
            // handle CLIENT_ERROR
            if ( response.getStatusCode() == HttpStatus.BAD_REQUEST) {
                StringBuilder stringBuilder = new StringBuilder();
                try (Reader reader = new BufferedReader(new InputStreamReader
                        (response.getBody(), StandardCharsets.UTF_8))) {
                    int c = 0;
                    while ((c = reader.read()) != -1) {
                        stringBuilder.append((char) c);
                    }
                }
                BuildErrorResult buildErrorResult = objectMapper.readValue(stringBuilder.toString(), BuildErrorResult.class);
                throw new HttpRequestFailedException(ErrorCode.BAD_REQUEST_DATA, buildErrorResult.getDetail());
            } else {
                StringBuilder stringBuilder = new StringBuilder();
                try (Reader reader = new BufferedReader(new InputStreamReader
                        (response.getBody(), StandardCharsets.UTF_8))) {
                    int c = 0;
                    while ((c = reader.read()) != -1) {
                        stringBuilder.append((char) c);
                    }
                }
                BuildErrorResult buildErrorResult = objectMapper.readValue(stringBuilder.toString(), BuildErrorResult.class);
                throw new HttpRequestFailedException(ErrorCode.INVALID_REQUEST, buildErrorResult.getDetail());
            }
        }
    }
}

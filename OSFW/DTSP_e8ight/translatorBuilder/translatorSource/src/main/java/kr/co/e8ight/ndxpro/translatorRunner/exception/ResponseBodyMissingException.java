package kr.co.e8ight.ndxpro.translatorRunner.exception;

public class ResponseBodyMissingException extends RuntimeException {
    public ResponseBodyMissingException(String message) {
        super(message);
    }
}
package org.kafka.connect.util;

/**
 * Drop-in replacement for org.json.JSONException to avoid the JSON License
 * ("shall be used for Good, not Evil") incompatibility.
 *
 * RuntimeException for parity with org.json's behavior.
 */
public class JSONException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public JSONException(String message) {
        super(message);
    }

    public JSONException(String message, Throwable cause) {
        super(message, cause);
    }

    public JSONException(Throwable cause) {
        super(cause);
    }
}

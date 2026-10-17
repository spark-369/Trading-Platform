package com.ftp.backend.exception;

/**
 * Base type for all application specific exceptions so that the
 * {@link GlobalExceptionHandler} can translate them into a stable
 * HTTP contract instead of leaking 500s or mapping everything to 400.
 */
public abstract class ApiException extends RuntimeException {

    private final int status;

    protected ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    protected ApiException(int status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}

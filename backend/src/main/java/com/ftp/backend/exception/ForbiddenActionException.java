package com.ftp.backend.exception;

import org.springframework.http.HttpStatus;

/** 403 - the caller is authenticated but not allowed to perform the action. */
public class ForbiddenActionException extends ApiException {

    public ForbiddenActionException(String message) {
        super(HttpStatus.FORBIDDEN.value(), message);
    }
}

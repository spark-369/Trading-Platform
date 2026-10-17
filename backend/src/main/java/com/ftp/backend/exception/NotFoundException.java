package com.ftp.backend.exception;

import org.springframework.http.HttpStatus;

/** 404 - the requested resource does not exist. */
public class NotFoundException extends ApiException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND.value(), message);
    }
}

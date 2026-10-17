package com.ftp.backend.exception;

import org.springframework.http.HttpStatus;

/** 422 - the request is syntactically valid but semantically unacceptable (e.g. insufficient funds). */
public class UnprocessableEntityException extends ApiException {

    public UnprocessableEntityException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY.value(), message);
    }
}

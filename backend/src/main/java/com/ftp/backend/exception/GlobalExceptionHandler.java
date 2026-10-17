package com.ftp.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Central translation of exceptions into a stable JSON error contract.
 *
 * <p>Every response has the shape:
 * <pre>
 * {
 *   "timestamp": "2026-01-01T00:00:00Z",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "human readable explanation",
 *   "path": "/api/trading/orders",
 *   "fieldErrors": { "quantity": "must be greater than 0" }   // only for validation errors
 * }
 * </pre>
 *
 * <p>Internal details (stack traces, SQL messages, exception class names) are
 * logged server side but never returned to the caller.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Application exceptions carry their own HTTP status. */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex, HttpServletRequest request) {
        if (ex.getStatus() >= 500) {
            log.error("API exception on {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        } else {
            log.debug("API exception on {}: {}", request.getRequestURI(), ex.getMessage());
        }
        return build(ex.getStatus(), ex.getMessage(), request, null);
    }


    /** Bean validation failures on {@code @RequestBody} arguments. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex,
                                                                HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() == null ? "invalid value" : fe.getDefaultMessage(),
                        (first, second) -> first,
                        LinkedHashMap::new));

        String message = fieldErrors.isEmpty()
                ? "Validation failed"
                : fieldErrors.entrySet().stream()
                        .map(e -> e.getKey() + ": " + e.getValue())
                        .collect(Collectors.joining("; "));

        return build(HttpStatus.BAD_REQUEST.value(), message, request, fieldErrors);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParam(MissingServletRequestParameterException ex,
                                                                  HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST.value(),
                "Required parameter '" + ex.getParameterName() + "' is missing", request, null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                                  HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST.value(),
                "Parameter '" + ex.getName() + "' has an invalid value", request, null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex,
                                                                HttpServletRequest request) {
        log.debug("Malformed request body on {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST.value(), "Malformed or unreadable request body", request, null);
    }

    /** Wrong credentials - must not reveal whether the user exists. */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex,
                                                                    HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED.value(), "Invalid username or password", request, null);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabled(DisabledException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN.value(), "Account is disabled", request, null);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUsernameNotFound(UsernameNotFoundException ex,
                                                                      HttpServletRequest request) {
        log.debug("Authentication failure on {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.UNAUTHORIZED.value(), "Invalid username or password", request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex,
                                                                  HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN.value(), "Access is denied", request, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResource(NoResourceFoundException ex,
                                                                HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND.value(), "Resource not found", request, null);
    }

    /** Database constraint violations (unique keys, FK integrity). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex,
                                                                   HttpServletRequest request) {
        log.warn("Data integrity violation on {}", request.getRequestURI(), ex);
        return build(HttpStatus.CONFLICT.value(),
                "The request conflicts with existing data", request, null);
    }

    /**
     * Fallback. Generic details are hidden from the client but logged in full
     * so operations can still diagnose the failure.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {}", request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred", request, null);
    }

    private ResponseEntity<Map<String, Object>> build(int status,
                                                      String message,
                                                      HttpServletRequest request,
                                                      Map<String, String> fieldErrors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status);
        body.put("error", reasonPhrase(status));
        body.put("message", message);
        body.put("path", request.getRequestURI());
        if (fieldErrors != null && !fieldErrors.isEmpty()) {
            body.put("fieldErrors", fieldErrors);
        }
        return ResponseEntity.status(status).body(body);
    }

    private String reasonPhrase(int status) {
        HttpStatus resolved = HttpStatus.resolve(status);
        return resolved != null ? resolved.getReasonPhrase() : "Error";
    }
}

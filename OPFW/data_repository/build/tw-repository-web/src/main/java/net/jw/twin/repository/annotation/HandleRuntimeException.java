package net.jw.twin.repository.annotation;

import net.jw.twin.repository.exception.ErrorStatus;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface HandleRuntimeException {
    ErrorStatus value();
}

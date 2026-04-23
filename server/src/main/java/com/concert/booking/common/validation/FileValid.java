package com.concert.booking.common.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = FileValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface FileValid {

  String message() default "File không hợp lệ";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  int maxSize() default 5;

  String[] types() default {};

  boolean required() default false;
}

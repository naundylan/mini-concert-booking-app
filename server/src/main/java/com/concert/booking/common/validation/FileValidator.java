package com.concert.booking.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public class FileValidator implements ConstraintValidator<FileValid, MultipartFile> {
  private int maxSize;
  private List<String> types;
  private boolean required;

  @Override
  public void initialize(FileValid constraintAnnotation) {
    this.maxSize = constraintAnnotation.maxSize();
    this.types = Arrays.asList(constraintAnnotation.types());
    this.required = constraintAnnotation.required();
  }

  @Override
  public boolean isValid(MultipartFile file, ConstraintValidatorContext context) {
    if (file == null || file.isEmpty()) {
      if (required) {
        context.disableDefaultConstraintViolation();
        context
            .buildConstraintViolationWithTemplate("File không được để trống")
            .addConstraintViolation();
        return false;
      }
      return true;
    }

    long maxBytes = maxSize * 1024L * 1024L;
    if (file.getSize() > maxBytes) {
      context.disableDefaultConstraintViolation();
      context
          .buildConstraintViolationWithTemplate("File vượt quá " + maxSize + "MB")
          .addConstraintViolation();
      return false;
    }

    if (!types.isEmpty()) {
      String contentType = file.getContentType();
      if (contentType == null || !types.contains(contentType)) {
        context.disableDefaultConstraintViolation();
        context
            .buildConstraintViolationWithTemplate("File phải thuộc loại: " + types)
            .addConstraintViolation();
        return false;
      }
    }

    return true;
  }
}

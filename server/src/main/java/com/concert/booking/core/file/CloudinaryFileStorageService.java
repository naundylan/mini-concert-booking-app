package com.concert.booking.core.file;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.concert.booking.common.constants.CloudinaryProperties;
import com.concert.booking.common.constants.MessageConstants;
import com.concert.booking.common.exception.AppException;
import java.io.IOException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CloudinaryFileStorageService implements FileStorageService {

  Cloudinary cloudinary;
  CloudinaryProperties cloudinaryProperties;

  @Override
  public String upload(MultipartFile file, String name) {
    try {
      var uploadResult =
          cloudinary
              .uploader()
              .upload(
                  file.getBytes(),
                  ObjectUtils.asMap(
                      "folder",
                      cloudinaryProperties.getFolder(),
                      "public_id",
                      name,
                      "overwrite",
                      true,
                      "resource_type",
                      "image"));

      return (String) uploadResult.get("secure_url");
    } catch (IOException e) {
      throw new AppException(
          HttpStatus.INTERNAL_SERVER_ERROR, MessageConstants.INTERNAL_SERVER_ERROR.getMessage());
    }
  }
}
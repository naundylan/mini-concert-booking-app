package com.concert.booking.core.file;

import java.util.EnumMap;
import java.util.Map;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import com.concert.booking.common.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileStorageFactory {
  Map<FileStorageType, FileStorageService> storageServices;

  public FileStorageFactory(CloudinaryFileStorageService cloudinaryFileStorageService) {
    this.storageServices = new EnumMap<>(FileStorageType.class);
    this.storageServices.put(FileStorageType.CLOUDINARY, cloudinaryFileStorageService);
  }

  public FileStorageService get(FileStorageType type) {
    FileStorageService service = storageServices.get(type);
    if (service == null) {
      throw new AppException(HttpStatus.BAD_REQUEST, "Unsupported file storage type: " + type);
    }
    return service;
  }
}

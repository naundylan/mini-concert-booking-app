package com.concert.booking.core.file;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileService {
  FileStorageFactory fileStorageFactory;

  public String upload(MultipartFile file, String name) {
    return fileStorageFactory.get(FileStorageType.CLOUDINARY).upload(file, name);
  }
}

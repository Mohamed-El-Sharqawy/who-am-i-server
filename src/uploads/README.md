# Uploads Module

## Overview
The Uploads Module provides a comprehensive file upload system for the "Who Am I?" game platform. It handles file uploads, validation, storage, and integration with cloud storage services, enabling secure and efficient management of user-generated content such as avatars, card images, and other media assets.

## Features
- **File Upload**: Secure handling of file uploads via multipart/form-data
- **Validation**: File type, size, and content validation
- **Local Storage**: Temporary storage of uploaded files
- **Cloud Integration**: Seamless integration with Cloudinary for permanent storage
- **Error Handling**: Robust error handling for upload failures
- **Cleanup**: Automatic cleanup of temporary files

## Acceptance Criteria
- File uploads are secure and properly validated
- Only allowed file types and sizes are accepted
- Uploaded files are properly stored and accessible
- Integration with Cloudinary works seamlessly
- Error handling provides clear, actionable messages
- Temporary files are properly cleaned up

## Technical Implementation

### Architecture
- **Uploads Controller**: Handles HTTP requests for file uploads
- **Uploads Service**: Contains business logic for file processing
- **Multer Integration**: Uses Multer for multipart/form-data parsing
- **Storage Strategies**: Configurable storage strategies (disk, memory, cloud)

### Key Components

#### Uploads Service
- Provides methods for handling file uploads
- Validates file types and sizes
- Manages temporary storage
- Integrates with Cloudinary for permanent storage

#### File Validation
- MIME type validation
- File size limits
- Content validation for images
- Virus scanning (optional)

### Integration Points
- **User Module**: For avatar image uploads
- **Cards Module**: For card image uploads
- **Cloudinary Module**: For permanent cloud storage
- **Config Module**: Sources upload configuration

### Technologies & Packages
- NestJS for API framework
- Multer for handling multipart/form-data
- Sharp for image processing and validation
- File-type for MIME type validation
- Cloudinary for cloud storage

## Usage Examples

### Basic File Upload
```typescript
// Client-side example
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/uploads/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
// result: { url: 'https://example.com/path/to/file.jpg' }
```

### Server-Side Implementation
```typescript
// Server-side example
@Post('avatar')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/temp',
      filename: editFileName,
    }),
    fileFilter: imageFileFilter,
    limits: {
      fileSize: 1024 * 1024, // 1MB
    },
  }),
)
async uploadAvatar(
  @UploadedFile() file: Express.Multer.File,
  @Request() req,
): Promise<{ url: string }> {
  try {
    // Process the file (e.g., upload to Cloudinary)
    const result = await this.uploadsService.processAvatarUpload(file, req.user.id);
    
    // Clean up temporary file
    await fs.unlink(file.path);
    
    return { url: result.url };
  } catch (error) {
    // Clean up on error
    if (file?.path) {
      await fs.unlink(file.path).catch(() => {});
    }
    throw error;
  }
}
```

## Performance Considerations
- File size limits prevent server overload
- Temporary files are stored on fast local storage
- Asynchronous processing for large files
- Stream processing for efficient memory usage

## Security Considerations
- File type validation prevents malicious file uploads
- File size limits prevent denial of service attacks
- Authentication required for all upload endpoints
- Temporary files are stored outside web root
- Virus scanning can be implemented for additional security
- Unique filenames prevent overwriting existing files

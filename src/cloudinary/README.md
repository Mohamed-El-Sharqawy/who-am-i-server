# Cloudinary Module

## Overview
The Cloudinary Module provides seamless integration with the Cloudinary cloud service for image and media management in the "Who Am I?" game platform. It handles media uploads, transformations, optimization, and delivery, enabling efficient management of user avatars, card images, category icons, and other media assets.

## Features
- **Media Upload**: Secure uploading of images and other media files
- **Image Transformations**: On-the-fly resizing, cropping, and optimization
- **CDN Delivery**: Fast, global content delivery through Cloudinary's CDN
- **Asset Management**: Organized storage and retrieval of media assets
- **Upload Signing**: Secure signature generation for client-side uploads
- **Error Handling**: Robust error handling for upload and transformation failures

## Acceptance Criteria
- Media uploads are secure and properly validated
- Images are automatically optimized for web delivery
- Uploaded assets are organized in appropriate folders
- Transformations produce correct image sizes and formats
- CDN URLs are properly generated and accessible
- Error handling provides clear, actionable messages

## Technical Implementation

### Architecture
- **Cloudinary Service**: Core service providing Cloudinary client functionality
- **Cloudinary Provider**: NestJS provider for Cloudinary configuration
- **Upload Controller**: Optional controller for handling direct uploads
- **Upload DTOs**: Data transfer objects for upload requests and responses

### Key Components

#### Cloudinary Service
- Provides methods for uploading media files
- Generates transformation URLs for different use cases
- Manages asset organization and tagging
- Handles error cases and retries

#### Cloudinary Configuration
- Manages Cloudinary API credentials
- Configures upload presets and defaults
- Sets up security policies for uploads

### Integration Points
- **User Module**: For avatar image uploads and management
- **Cards Module**: For card image uploads and transformations
- **Categories Module**: For category icon uploads
- **Config Module**: Sources Cloudinary API credentials
- **Uploads Module**: Works with local file uploads before Cloudinary processing

### Technologies & Packages
- Cloudinary Node.js SDK
- NestJS for framework integration
- Multer for handling multipart/form-data
- Sharp for optional local image processing

## Usage Examples

### Uploading an Image
```typescript
// Server-side example
@Injectable()
export class SomeService {
  constructor(private cloudinaryService: CloudinaryService) {}

  async uploadUserAvatar(userId: string, file: Express.Multer.File) {
    try {
      const result = await this.cloudinaryService.uploadImage(
        file.buffer,
        {
          folder: 'avatars',
          public_id: userId,
          overwrite: true,
          transformation: [{ width: 250, height: 250, crop: 'fill' }]
        }
      );
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload avatar');
    }
  }
}
```

### Generating Transformation URLs
```typescript
// Server-side example
getOptimizedImageUrl(publicId: string, width: number, height: number): string {
  return this.cloudinaryService.getImageUrl(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}
```

### Client-Side Upload (with signed upload)
```typescript
// Server-side signature generation
@Post('signature')
@UseGuards(JwtAuthGuard)
async getUploadSignature(): Promise<{ signature: string; timestamp: number }> {
  return this.cloudinaryService.generateUploadSignature();
}

// Client-side usage
const { signature, timestamp } = await api.post('/uploads/signature');
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('api_key', CLOUDINARY_API_KEY);
formData.append('timestamp', timestamp);
formData.append('signature', signature);
formData.append('folder', 'user_uploads');

const response = await fetch(`https://api.cloudinary.com/v1_1/your-cloud-name/image/upload`, {
  method: 'POST',
  body: formData,
});
```

## Performance Considerations
- Images are automatically optimized for web delivery
- CDN caching improves global access performance
- Responsive images with appropriate sizes reduce bandwidth usage
- Eager transformations reduce on-the-fly processing

## Security Considerations
- API credentials are securely managed via environment variables
- Upload signatures prevent unauthorized uploads
- Content validation ensures only safe media types are accepted
- Resource types are restricted to prevent abuse
- Upload rate limiting prevents abuse

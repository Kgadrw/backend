# Cloudinary Configuration

## ✅ Your Cloudinary Credentials

**Cloud Name:** `dgmexpa8v`  
**API Key:** `577674637224497`  
**API Secret:** `_8Ks_XU3nurQTFUbVA3RxpbcXFE`  
**CLOUDINARY_URL:** `cloudinary://577674637224497:_8Ks_XU3nurQTFUbVA3RxpbcXFE@dgmexpa8v`

## 🔧 Configuration

The Cloudinary credentials have been added to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=dgmexpa8v
CLOUDINARY_API_KEY=577674637224497
CLOUDINARY_API_SECRET=_8Ks_XU3nurQTFUbVA3RxpbcXFE
CLOUDINARY_URL=cloudinary://577674637224497:_8Ks_XU3nurQTFUbVA3RxpbcXFE@dgmexpa8v
```

## 📤 Image Upload Endpoints

### Upload Images to Artwork

**Endpoint:** `POST /api/artworks/:id/upload`

**Headers:**
```
Authorization: Bearer <auth0_token>
Content-Type: multipart/form-data
```

**Request:**
- Use `FormData` with field name `images`
- Multiple files allowed (up to 5)
- Max file size: 5MB per file
- Supported formats: JPG, JPEG, PNG, GIF, WEBP

**Example:**
```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);

const response = await fetch(`http://localhost:5000/api/artworks/${artworkId}/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

### Upload Images When Creating Artwork

**Endpoint:** `POST /api/artworks`

**Headers:**
```
Authorization: Bearer <auth0_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Beautiful Artwork",
  "description": "Description here",
  "price": 50000,
  "images": [
    "https://res.cloudinary.com/dgmexpa8v/image/upload/v1234567890/artwork1.jpg",
    "https://res.cloudinary.com/dgmexpa8v/image/upload/v1234567890/artwork2.jpg"
  ]
}
```

**Note:** For direct uploads from frontend, you can upload images to Cloudinary first, then include the URLs in the artwork creation request.

## 🖼️ Frontend Upload Example

### Option 1: Upload to Cloudinary First (Recommended)

```javascript
import { upload } from './cloudinary-config'; // Your Cloudinary config

const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'your_upload_preset'); // Set in Cloudinary dashboard
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dgmexpa8v/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  const data = await response.json();
  return data.secure_url; // Returns the image URL
};

// Use in your component
const handleImageUpload = async (files) => {
  const imageUrls = await Promise.all(
    Array.from(files).map(file => uploadImageToCloudinary(file))
  );
  
  // Now create artwork with image URLs
  const artworkData = {
    title: 'My Artwork',
    images: imageUrls,
    // ... other fields
  };
  
  // POST to /api/artworks
};
```

### Option 2: Upload via Backend Endpoint

```javascript
const uploadArtworkImages = async (artworkId, files) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('images', file);
  });
  
  const response = await fetch(
    `http://localhost:5000/api/artworks/${artworkId}/upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );
  
  const data = await response.json();
  return data;
};
```

## 🔐 Cloudinary Dashboard Setup

### 1. Create Upload Preset (Optional but Recommended)

1. Go to [Cloudinary Dashboard](https://console.cloudinary.com)
2. Navigate to **Settings** → **Upload**
3. Click **Add upload preset**
4. Configure:
   - **Preset name:** `art-marketplace` (or your choice)
   - **Signing mode:** Unsigned (for frontend uploads) or Signed (more secure)
   - **Folder:** `art-marketplace`
   - **Allowed formats:** jpg, jpeg, png, gif, webp
   - **Max file size:** 5MB
   - **Transformation:** Width: 1200, Height: 1200, Crop: Limit

### 2. Transformations

Images are automatically transformed:
- **Max dimensions:** 1200x1200px
- **Crop mode:** Limit (maintains aspect ratio)
- **Folder:** `art-marketplace/`

## 📝 Example Usage

### Complete Workflow

```javascript
// 1. Upload image to Cloudinary
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'art-marketplace');
  formData.append('folder', 'art-marketplace');
  
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/dgmexpa8v/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );
  
  return response.json();
};

// 2. Create artwork with image URLs
const createArtwork = async (artworkData, images) => {
  // Upload all images
  const imageUploads = await Promise.all(
    images.map(img => uploadToCloudinary(img))
  );
  
  const imageUrls = imageUploads.map(upload => upload.secure_url);
  
  // Create artwork
  const response = await fetch('http://localhost:5000/api/artworks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...artworkData,
      images: imageUrls,
    }),
  });
  
  return response.json();
};
```

## 🚀 Image URLs Format

Uploaded images will have URLs like:
```
https://res.cloudinary.com/dgmexpa8v/image/upload/v1234567890/art-marketplace/artwork-image.jpg
```

## 🔒 Security Notes

1. **Never expose API Secret** - Keep it in `.env` file only
2. **Use Upload Presets** - Configure presets in Cloudinary dashboard
3. **Set CORS** - Configure allowed origins in Cloudinary dashboard
4. **File Validation** - Backend validates file types and sizes
5. **Signed Uploads** - Use signed uploads for production

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration)


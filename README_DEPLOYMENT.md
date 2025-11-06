# Render Deployment Guide

## Swagger UI Documentation

The API documentation is available at:
- **Swagger UI**: `https://your-backend.onrender.com/api-docs`
- **Swagger JSON**: `https://your-backend.onrender.com/api-docs.json`
- **Root Endpoint**: `https://your-backend.onrender.com/` (returns API info)

## Environment Variables for Render

Set these in your Render dashboard:

### Required
```env
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=https://your-frontend-domain.com
```

### Optional (for Swagger)
```env
API_URL=https://your-backend.onrender.com
RENDER_EXTERNAL_URL=https://your-backend.onrender.com  # Auto-set by Render
SUPPORT_EMAIL=support@indatwaart.com
```

### Other Environment Variables
```env
PORT=5000  # Render sets this automatically, but you can override
SESSION_SECRET=your_secure_session_secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Render Deployment Steps

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository** (backend folder)
3. **Set build command**: `npm install`
4. **Set start command**: `npm start`
5. **Set root directory**: `backend` (if deploying from monorepo)
6. **Add all environment variables** listed above
7. **Deploy**

## Testing Swagger UI

After deployment:
1. Visit `https://your-backend.onrender.com/api-docs`
2. The Swagger UI should load with all API endpoints
3. You can test endpoints directly from the Swagger interface

## Notes

- Render automatically sets `RENDER_EXTERNAL_URL` environment variable
- The Swagger config uses this to set the production server URL
- If `API_URL` is set, it takes precedence over `RENDER_EXTERNAL_URL`
- The root route (`/`) now returns API information instead of 404


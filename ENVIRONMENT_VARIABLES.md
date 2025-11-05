# Environment Variables Configuration

## 🚨 Required for Deployment

### MONGODB_URI (REQUIRED)
```
mongodb+srv://kalisa:%3CKigali20%40%3E@cluster0.bpji5nd.mongodb.net/art-marketplace?retryWrites=true&w=majority&appName=Cluster0
```

**Important:** The password must be URL-encoded:
- `<` becomes `%3C`
- `>` becomes `%3E`
- `@` becomes `%40`

### SESSION_SECRET (REQUIRED for production)
Generate a secure random string:
```bash
openssl rand -hex 32
```

Or use an online generator: https://generate-secret.vercel.app/32

### PORT (Optional - Render sets this automatically)
```
5000
```

### FRONTEND_URL (Required for CORS)
For production:
```
https://your-frontend-domain.com
```

For development (multiple origins):
```
http://localhost:5173,http://localhost:8080
```

---

## 🔧 Optional Variables

### Google OAuth (Optional)
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url.onrender.com/api/auth/google/callback
```

### Cloudinary (Optional - for image uploads)
```
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

Or use the single URL format:
```
CLOUDINARY_URL=cloudinary://your-api-key:your-api-secret@your-cloud-name
```

---

## 📝 How to Set Environment Variables on Render

1. Go to your Render dashboard
2. Select your backend service
3. Click on **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Enter the variable name and value
6. Click **Save Changes**
7. Render will automatically redeploy your service

---

## ✅ Verification

After setting environment variables, verify they're loaded:

1. Check the deployment logs for:
   - `✅ MongoDB Connected: ...`
   - `✅ Google OAuth strategy initialized` (if Google credentials are set)
   - `✅ Using MongoDB session store` (in production)

2. Test the health endpoint:
   ```
   https://your-backend-url.onrender.com/api/health
   ```

---

## 🐛 Common Issues

### Error: "MONGODB_URI is not defined"
**Solution:** Add `MONGODB_URI` to Render environment variables

### Error: "MemoryStore warning"
**Solution:** This is a warning, not an error. For production, make sure `MONGODB_URI` is set and `NODE_ENV=production` is set. The system will automatically use MongoDB session store.

### CORS Errors
**Solution:** Make sure `FRONTEND_URL` is set correctly in Render environment variables


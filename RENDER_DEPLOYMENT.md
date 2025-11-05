# Render Deployment Guide

## 🚀 Environment Variables Setup

To deploy your backend to Render, you need to configure the following environment variables in your Render dashboard:

### Required Environment Variables

1. **MONGODB_URI** (Required)
   ```
   mongodb+srv://kalisa:<Kigali20@>@cluster0.bpji5nd.mongodb.net/art-marketplace?retryWrites=true&w=majority&appName=Cluster0
   ```
   **Important:** URL-encode special characters in the password:
   - Replace `<` with `%3C`
   - Replace `>` with `%3E`
   - Replace `@` with `%40`
   
   Final format:
   ```
   mongodb+srv://kalisa:%3CKigali20%40%3E@cluster0.bpji5nd.mongodb.net/art-marketplace?retryWrites=true&w=majority&appName=Cluster0
   ```

2. **PORT** (Optional - Render sets this automatically)
   ```
   5000
   ```

3. **FRONTEND_URL** (Required for CORS)
   ```
   https://your-frontend-domain.com
   ```
   Or for local development:
   ```
   http://localhost:5173,http://localhost:8080
   ```

4. **SESSION_SECRET** (Required for Passport sessions)
   ```
   Generate a long random string (at least 32 characters)
   ```
   You can generate one using:
   ```bash
   openssl rand -hex 32
   ```

### Optional Environment Variables (for additional features)

5. **GOOGLE_CLIENT_ID** (For Google OAuth)
   ```
   your-google-client-id.apps.googleusercontent.com
   ```

6. **GOOGLE_CLIENT_SECRET** (For Google OAuth)
   ```
   your-google-client-secret
   ```

7. **GOOGLE_CALLBACK_URL** (For Google OAuth)
   ```
   https://your-backend-url.onrender.com/api/auth/google/callback
   ```

8. **CLOUDINARY_CLOUD_NAME** (For image uploads)
   ```
   dgmexpa8v
   ```

9. **CLOUDINARY_API_KEY** (For image uploads)
   ```
   your-cloudinary-api-key
   ```

10. **CLOUDINARY_API_SECRET** (For image uploads)
    ```
    your-cloudinary-api-secret
    ```

## 📝 How to Add Environment Variables on Render

1. Go to your Render dashboard
2. Select your backend service
3. Navigate to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable with its value
6. Save and redeploy

## ⚠️ Important Notes

1. **MongoDB URI:** Make sure to URL-encode special characters in the password
2. **Session Store:** The current setup uses memory store which is fine for development. For production, consider using MongoDB session store (see below)
3. **CORS:** Update `FRONTEND_URL` to match your deployed frontend URL
4. **Google OAuth:** Update `GOOGLE_CALLBACK_URL` to your Render backend URL
5. **Never commit `.env` file** - it's already in `.gitignore`

## 🔧 Production Session Store (Optional)

For production, you can use MongoDB session store instead of memory store:

```bash
npm install connect-mongo
```

Then update `server.js`:

```javascript
import MongoStore from 'connect-mongo';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));
```

## 🐛 Troubleshooting

### Error: "uri parameter must be a string, got undefined"

**Solution:** Make sure `MONGODB_URI` is set in Render environment variables

### Error: "MemoryStore warning"

**Solution:** This is a warning, not an error. For production, consider using MongoDB session store (see above)

### CORS Errors

**Solution:** Make sure `FRONTEND_URL` is set correctly in Render environment variables

## ✅ Deployment Checklist

- [ ] MongoDB URI configured (with URL-encoded password)
- [ ] SESSION_SECRET generated and added
- [ ] FRONTEND_URL set to your frontend domain
- [ ] PORT set (or let Render auto-assign)
- [ ] Google OAuth credentials added (if using Google login)
- [ ] Cloudinary credentials added (if using image uploads)
- [ ] Service successfully deployed
- [ ] Health check endpoint working: `https://your-backend-url.onrender.com/api/health`


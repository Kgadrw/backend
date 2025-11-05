# Auth0 Express OpenID Connect Integration

## ✅ Configuration Complete

Your backend is now configured with `express-openid-connect` for Auth0 authentication.

## 🔧 Setup

### 1. Environment Variables

The following environment variables are configured in `.env`:

```env
AUTH0_DOMAIN=dev-f3kd2ekgbk5qvp82.us.auth0.com
AUTH0_CLIENT_ID=HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo
AUTH0_CLIENT_SECRET=TVY0KiwG_VIUumvCOlm8Ev93jNqKP0noJW60ba2-_r0xNdciE6s-bc708eqPn5EL
AUTH0_SECRET=<generated-secret>
BASE_URL=http://localhost:5000
```

**Note:** Generate a secret using:
```bash
openssl rand -hex 32
```

Or on Windows PowerShell:
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[System.BitConverter]::ToString($bytes).Replace('-', '').ToLower()
```

### 2. Auth0 Dashboard Configuration

Make sure your Auth0 Application has these URLs configured:

- **Allowed Callback URLs:** `http://localhost:5000/api/auth/callback`
- **Allowed Logout URLs:** `http://localhost:5173`
- **Allowed Web Origins:** `http://localhost:5000`

## 📍 Routes

### Public Routes

- `GET /api/auth/login` - Redirects to Auth0 login
- `GET /api/auth/logout` - Logs out and redirects
- `GET /api/auth/callback` - Auth0 callback (handled automatically)

### Protected Routes

- `GET /api/auth/profile` - Get user profile (requires `requiresAuth()`)
- `GET /api/auth/session` - Get session user (requires `requiresAuth()`)

## 🔐 Using requiresAuth Middleware

### Example 1: Simple Protected Route

```javascript
import { requiresAuth } from 'express-openid-connect';

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});
```

### Example 2: Protected Route with MongoDB Sync

```javascript
import { requiresAuth0Session } from './middlewares/auth0.middleware.js';

app.get('/api/profile', requireAuth0Session, (req, res) => {
  // req.oidc.user - Auth0 user info
  // req.mongoUser - MongoDB user document
  res.json({
    auth0User: req.oidc.user,
    mongoUser: req.mongoUser,
  });
});
```

### Example 3: Custom Route Protection

```javascript
import { requiresAuth } from 'express-openid-connect';
import { syncAuth0User } from './middlewares/auth0.middleware.js';

router.get('/protected-route', 
  requiresAuth(),  // Requires Auth0 authentication
  syncAuth0User,    // Syncs user with MongoDB
  (req, res) => {
    // Your route handler
    res.json({ user: req.mongoUser });
  }
);
```

## 🎯 Current Implementation

### Server Setup

```javascript
import { auth } from 'express-openid-connect';
import { auth0Config } from './config/auth0.config.js';

// Auth0 router attaches /login, /logout, and /callback routes
app.use(auth(auth0Config));
```

### Protected Routes

```javascript
// Profile route using requiresAuth()
router.get('/profile', requireAuth0Auth, syncAuth0User, getProfile);
```

## 📝 Available Middleware

### 1. `requiresAuth()` from express-openid-connect
- Checks for valid Auth0 session
- Redirects to login if not authenticated
- Makes `req.oidc.user` available

### 2. `syncAuth0User` (Custom)
- Syncs Auth0 user with MongoDB
- Creates/updates user document
- Makes `req.mongoUser` available

### 3. `requireAuth0Session` (Combined)
- Combines `requiresAuth()` + `syncAuth0User`
- Use for routes needing both Auth0 auth and MongoDB sync

## 🔄 Authentication Flow

1. **User visits protected route** → `requiresAuth()` checks session
2. **If not authenticated** → Redirects to `/api/auth/login`
3. **User authenticates with Auth0** → Redirected back to `/api/auth/callback`
4. **Session created** → User can access protected routes
5. **MongoDB sync** → `syncAuth0User` creates/updates user in MongoDB
6. **Route handler** → Access `req.oidc.user` and `req.mongoUser`

## 🧪 Testing

### Test Login Flow

1. Start your server:
   ```bash
   cd backend
   npm run dev
   ```

2. Visit login URL:
   ```
   http://localhost:5000/api/auth/login
   ```

3. Authenticate with Auth0

4. You'll be redirected back to your app

5. Visit protected route:
   ```
   http://localhost:5000/api/auth/profile
   ```

### Test with cURL

```bash
# Follow redirects to see login flow
curl -L http://localhost:5000/api/auth/profile

# Or with session cookie
curl -b cookies.txt -c cookies.txt http://localhost:5000/api/auth/login
curl -b cookies.txt http://localhost:5000/api/auth/profile
```

## 🔗 API Endpoints

### GET /api/auth/login
Redirects to Auth0 login page.

### GET /api/auth/logout
Logs out user and redirects to post-logout URL.

### GET /api/auth/callback
Auth0 callback handler (automatically handled).

### GET /api/auth/profile (Protected)
Returns user profile with both Auth0 and MongoDB user data.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ARTIST",
      "avatar": "https://...",
      "isVerified": true
    },
    "auth0": {
      "isAuthenticated": true,
      "user": {
        "sub": "auth0|...",
        "email": "john@example.com",
        "name": "John Doe"
      }
    }
  }
}
```

## 🚨 Important Notes

1. **Session-based**: Uses Express sessions (not JWT tokens)
2. **Cookies**: Requires cookie support for session management
3. **CORS**: Make sure CORS is configured for your frontend
4. **Base URL**: Set `BASE_URL` in `.env` to match your server URL
5. **Secret**: Use a strong, random secret for session encryption

## 🔄 Frontend Integration

For React frontend, you can:

1. **Option 1: Use Auth0 React SDK** (Recommended for SPAs)
   - Frontend handles authentication
   - Backend validates tokens (JWT approach)

2. **Option 2: Use Session-based Auth** (Current setup)
   - Backend handles authentication
   - Frontend redirects to `/api/auth/login`
   - Session cookies manage authentication

## 📚 Resources

- [express-openid-connect Documentation](https://github.com/auth0/express-openid-connect)
- [Auth0 Express Quickstart](https://auth0.com/docs/quickstart/webapp/express)
- [Session Management](https://auth0.com/docs/secure/sessions)


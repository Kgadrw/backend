# Auth0 Integration Setup Guide

This backend is configured to use Auth0 for authentication. Here's how to set it up:

## 🔧 Auth0 Dashboard Configuration

### 1. API Configuration

1. Go to your Auth0 Dashboard → **APIs**
2. Create a new API or use an existing one
3. Set the **Identifier** to: `HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo` (or your API identifier)
4. Enable **Enable RBAC** and **Add Permissions in the Access Token**
5. Add the following permissions:
   - `read:artworks`
   - `write:artworks`
   - `read:orders`
   - `write:orders`

### 2. Application Configuration

1. Go to **Applications** → Your Application
2. Under **Allowed Callback URLs**, add:
   - `http://localhost:3000/callback` (or your frontend callback URL)
   - `http://localhost:5173/callback` (if using Vite default port)
   - Add your production URL when deploying
3. Under **Allowed Logout URLs**, add:
   - `http://localhost:3000` (or your frontend URL)
   - `http://localhost:5173` (if using Vite default port)
   - Add your production URL when deploying
4. Under **Allowed Web Origins**, add:
   - `http://localhost:3000`
   - `http://localhost:5173`
5. Under **Allowed Origins (CORS)**, add:
   - `http://localhost:3000`
   - `http://localhost:5173`

### 3. Custom Claims (Optional - for User Roles)

To add custom user roles (ARTIST, BUYER, ADMIN), you can use Auth0 Rules or Actions:

**Auth0 Rule Example:**
```javascript
function addRoleToToken(user, context, callback) {
  const namespace = 'https://art-marketplace.com/';
  
  // Get user role from user metadata or app_metadata
  const role = user.app_metadata?.role || user.user_metadata?.role || 'BUYER';
  
  context.idToken[namespace + 'role'] = role;
  context.accessToken[namespace + 'role'] = role;
  
  callback(null, user, context);
}
```

**Or using Auth0 Actions:**
1. Go to **Actions** → **Flows** → **Login**
2. Create a new action to add custom claims
3. Add the role to the token claims

### 4. User Metadata

To set user roles, you can update user metadata in Auth0:
- Go to **User Management** → **Users** → Select a user
- Under **User Metadata** or **App Metadata**, add:
  ```json
  {
    "role": "ARTIST"
  }
  ```

## 🔐 Environment Variables

The following environment variables are already configured in `.env`:

```env
AUTH0_DOMAIN=dev-f3kd2ekgbk5qvp82.us.auth0.com
AUTH0_CLIENT_ID=HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo
AUTH0_CLIENT_SECRET=TVY0KiwG_VIUumvCOlm8Ev93jNqKP0noJW60ba2-_r0xNdciE6s-bc708eqPn5EL
AUTH0_AUDIENCE=HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo
```

## 📱 Frontend Integration

### 1. Install Auth0 React SDK

```bash
npm install @auth0/auth0-react
```

### 2. Wrap your app with Auth0Provider

```jsx
import { Auth0Provider } from '@auth0/auth0-react';

function App() {
  return (
    <Auth0Provider
      domain="dev-f3kd2ekgbk5qvp82.us.auth0.com"
      clientId="HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo",
      }}
    >
      {/* Your app */}
    </Auth0Provider>
  );
}
```

### 3. Use Auth0 in Components

```jsx
import { useAuth0 } from '@auth0/auth0-react';

function MyComponent() {
  const { user, isAuthenticated, getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();

  const callApi = async () => {
    try {
      const token = await getAccessTokenSilently();
      
      const response = await fetch('http://localhost:5000/api/artworks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user.name}!</p>
        <button onClick={callApi}>Call API</button>
        <button onClick={() => logout()}>Logout</button>
      </div>
    );
  }

  return <button onClick={() => loginWithRedirect()}>Login</button>;
}
```

## 🔄 Backend Flow

1. **Frontend authenticates with Auth0** → Gets access token
2. **Frontend sends requests to backend** → Includes `Authorization: Bearer <token>`
3. **Backend validates token** → Uses Auth0's public keys (JWKS)
4. **Backend creates/updates user in MongoDB** → Syncs user data from Auth0
5. **Backend processes request** → Uses MongoDB user for authorization

## 🛡️ How It Works

1. **Token Verification**: The backend verifies Auth0 JWT tokens using Auth0's public keys (JWKS endpoint)
2. **User Sync**: When a token is verified, the backend:
   - Extracts user info from the token
   - Checks if user exists in MongoDB
   - Creates user if doesn't exist
   - Updates user info from Auth0
3. **Role-Based Access**: User roles are extracted from token claims or set to default 'BUYER'

## 📝 API Endpoints

### POST /api/auth/callback
Sync user from Auth0 (optional, as middleware handles it automatically)

**Request:**
```json
{
  "accessToken": "eyJhbGc..."
}
```

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
    }
  }
}
```

### GET /api/auth/me
Get current authenticated user (requires Auth0 token)

**Headers:**
```
Authorization: Bearer <auth0_token>
```

## 🚨 Important Notes

1. **Token Validation**: The backend automatically validates Auth0 tokens on protected routes
2. **User Creation**: Users are automatically created in MongoDB when they first authenticate
3. **Role Management**: Set user roles in Auth0 user metadata or app metadata
4. **Password Field**: The password field in MongoDB is set to 'auth0-user' as a placeholder since Auth0 handles authentication
5. **Token Refresh**: Auth0 SDK handles token refresh automatically on the frontend

## 🔍 Testing

1. Authenticate with Auth0 on the frontend
2. Get the access token
3. Make a request to any protected endpoint:
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:5000/api/auth/me
   ```

## 📚 Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 React SDK](https://github.com/auth0/auth0-react)
- [Auth0 JWT Verification](https://auth0.com/docs/secure/tokens/json-web-tokens)


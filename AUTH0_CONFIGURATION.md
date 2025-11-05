# Auth0 Configuration Guide

## ✅ Your Auth0 Credentials

**Domain:** `dev-f3kd2ekgbk5qvp82.us.auth0.com`  
**Client ID:** `HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo`  
**Client Secret:** `TVY0KiwG_VIUumvCOlm8Ev93jNqKP0noJW60ba2-_r0xNdciE6s-bc708eqPn5EL`

## 🔧 Step 1: Configure Auth0 Dashboard

### Application Settings

1. Go to [Auth0 Dashboard](https://manage.auth0.com) → **Applications** → Your Application
2. Navigate to **Settings** tab
3. Configure the following URLs:

#### Allowed Callback URLs
```
http://localhost:3000/callback
http://localhost:5173/callback
```
*(Add your production URL when deploying: https://yourdomain.com/callback)*

#### Allowed Logout URLs
```
http://localhost:3000
http://localhost:5173
```
*(Add your production URL when deploying: https://yourdomain.com)*

#### Allowed Web Origins
```
http://localhost:3000
http://localhost:5173
```
*(Add your production URL when deploying: https://yourdomain.com)*

#### Allowed Origins (CORS)
```
http://localhost:3000
http://localhost:5173
```
*(Add your production URL when deploying: https://yourdomain.com)*

### API Configuration

1. Go to **APIs** → Create New API (or use existing)
2. Set **Identifier** to: `HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo`
3. Enable **Enable RBAC** 
4. Enable **Add Permissions in the Access Token**
5. Add the following permissions:
   - `read:artworks`
   - `write:artworks`
   - `read:orders`
   - `write:orders`

## 📝 Step 2: Backend Configuration

The backend `.env` file is already configured with your Auth0 credentials:

```env
AUTH0_DOMAIN=dev-f3kd2ekgbk5qvp82.us.auth0.com
AUTH0_CLIENT_ID=HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo
AUTH0_CLIENT_SECRET=TVY0KiwG_VIUumvCOlm8Ev93jNqKP0noJW60ba2-_r0xNdciE6s-bc708eqPn5EL
AUTH0_AUDIENCE=HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo
```

## 🎨 Step 3: Frontend Configuration

### Install Auth0 React SDK

```bash
npm install @auth0/auth0-react
```

### Wrap Your App with Auth0Provider

```jsx
// src/main.tsx or src/App.tsx
import { Auth0Provider } from '@auth0/auth0-react';

function App() {
  return (
    <Auth0Provider
      domain="dev-f3kd2ekgbk5qvp82.us.auth0.com"
      clientId="HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo"
      authorizationParams={{
        redirect_uri: window.location.origin + '/callback',
        audience: "HJCZOGao8VVr1ApTgWJUEXxxd01hiMJo",
      }}
    >
      {/* Your app components */}
    </Auth0Provider>
  );
}
```

### Create Callback Route

```jsx
// src/pages/Callback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export default function Callback() {
  const { isLoading, isAuthenticated, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/');
      } else if (error) {
        console.error('Auth error:', error);
        navigate('/');
      }
    }
  }, [isLoading, isAuthenticated, error, navigate]);

  return <div>Loading...</div>;
}
```

### Use Auth0 in Components

```jsx
import { useAuth0 } from '@auth0/auth0-react';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    getAccessTokenSilently, 
    loginWithRedirect, 
    logout 
  } = useAuth0();

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
      console.error('API call error:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.name}!</p>
        <p>Email: {user?.email}</p>
        <button onClick={callApi}>Call API</button>
        <button onClick={() => logout({ returnTo: window.location.origin })}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => loginWithRedirect()}>
      Login
    </button>
  );
}
```

## 🔄 How It Works

1. **User clicks Login** → Frontend redirects to Auth0
2. **User authenticates** → Auth0 redirects back to `/callback`
3. **Frontend gets token** → Auth0 SDK handles token storage
4. **Frontend makes API calls** → Includes `Authorization: Bearer <token>` header
5. **Backend validates token** → Verifies with Auth0's JWKS endpoint
6. **Backend syncs user** → Creates/updates user in MongoDB
7. **Backend processes request** → Returns data

## 🧪 Testing

1. Start your backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Start your frontend:
   ```bash
   npm run dev
   ```

3. Navigate to `http://localhost:3000` (or `http://localhost:5173`)

4. Click Login → You'll be redirected to Auth0

5. After authentication, you'll be redirected back

6. Make API calls using the token from Auth0

## 🚨 Important Notes

1. **Callbacks Must Match**: The callback URL in Auth0 Dashboard must match your frontend URL
2. **HTTPS in Production**: Use `https://` for production URLs
3. **Token Audience**: The audience must match your API identifier
4. **CORS**: Make sure your backend allows requests from your frontend origin
5. **User Roles**: Set user roles in Auth0 user metadata or app metadata

## 📚 Next Steps

1. ✅ Configure Auth0 Dashboard URLs
2. ✅ Install Auth0 React SDK
3. ✅ Set up Auth0Provider in your app
4. ✅ Create callback route
5. ✅ Test authentication flow
6. ✅ Test API calls with tokens

## 🔗 Resources

- [Auth0 React SDK Documentation](https://github.com/auth0/auth0-react)
- [Auth0 Dashboard](https://manage.auth0.com)
- [Auth0 API Documentation](https://auth0.com/docs/api)


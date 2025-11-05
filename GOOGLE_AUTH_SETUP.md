# Google Authentication Setup Guide

## ✅ Enable Google Social Login in Auth0

To allow users to sign in with Google, you need to configure Google as a social connection in your Auth0 dashboard.

### Step 1: Configure Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen if prompted
6. Select **Web application** as the application type
7. Add authorized redirect URIs:
   ```
   https://dev-f3kd2ekgbk5qvp82.us.auth0.com/login/callback
   ```
8. Copy your **Client ID** and **Client Secret**

### Step 2: Add Google Connection in Auth0

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Authentication** → **Social**
3. Click **+ Create Connection**
4. Select **Google**
5. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
6. Click **Save**
7. Make sure the connection is **enabled**

### Step 3: Enable Google Connection for Your Application

1. In Auth0 Dashboard, go to **Applications** → Your Application
2. Navigate to **Connections** tab
3. Enable the **Google** connection
4. Click **Save**

### Step 4: Configure Connection Settings (Optional)

You can customize the Google connection:
- **Requires Username**: Set to false (Google provides email)
- **Sync User Profile**: Enable to sync user data from Google
- **Attributes**: Map Google profile attributes to Auth0 user attributes

## 🔧 Frontend Configuration

The frontend is already configured to use Google login. The `handleGoogleLogin` function uses:

```javascript
connection: "google-oauth2"
```

This tells Auth0 to use the Google connection for authentication.

## 📝 User Flow

1. User clicks "Continue with Google" button
2. Redirects to Auth0's Google login page
3. User authenticates with Google
4. Auth0 redirects back to your app with user data
5. Backend syncs user with MongoDB
6. User is logged in

## 🎯 Features

- ✅ Google OAuth 2.0 authentication
- ✅ Automatic user profile sync
- ✅ Seamless integration with existing Auth0 flow
- ✅ Works with existing backend MongoDB sync

## 🚨 Important Notes

1. **Google OAuth Redirect URI**: Must match exactly in Google Cloud Console
2. **Auth0 Domain**: Use your Auth0 domain in the redirect URI
3. **Connection Name**: Default is `google-oauth2`, but you can customize it
4. **User Data**: Google provides email, name, and profile picture automatically

## 📚 Resources

- [Auth0 Google Social Connection](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Auth0 Social Connections](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers)

## ✅ Testing

1. Make sure Google connection is enabled in Auth0
2. Click "Continue with Google" on the login page
3. You should be redirected to Google's login page
4. After authentication, you'll be redirected back to your app
5. User should be logged in and synced with MongoDB


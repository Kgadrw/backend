# Admin User Setup

## Creating the Admin User

To create the admin user with the default credentials, run the following command from the `backend` directory:

```bash
npm run create-admin
```

This will create an admin user with:
- **Email:** `admin.indatwa@gmail.com`
- **Password:** `indatwa@2025`
- **Role:** `ADMIN`
- **Verified:** `true`

If the admin user already exists, the script will update the password and ensure the role is set to ADMIN.

## Admin Login

After creating the admin user, you can log in using:
- Email: `admin.indatwa@gmail.com`
- Password: `indatwa@2025`

## Changing Admin Credentials

Once logged in as admin, you can:
1. Navigate to `/admin/settings`
2. Update your profile (name and email) in the "Profile" tab
3. Change your password in the "Change Password" tab

## Admin Features

The admin dashboard provides:
- User management (view, edit, delete users)
- Artwork management (view, edit, delete artworks)
- Order management (view and update order statuses)
- Verification request review (approve/reject artist verification)
- Activity logs (view all platform activities)
- Profile and password management


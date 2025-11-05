# Art Marketplace Backend API

A complete backend system for an art marketplace built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Artist Profiles**: Custom profiles for artists with social links and bio
- **Artwork Management**: Full CRUD operations for artworks with image uploads
- **Likes & Comments**: Interactive engagement system with real-time updates
- **Orders**: Order management system for buyers and artists
- **Notifications**: Real-time notification system using Socket.io
- **Image Upload**: Cloudinary integration for image storage

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image uploads)

## 🛠️ Installation

1. **Clone the repository and navigate to backend folder**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure `.env` file**

The `.env` file has been created with the MongoDB connection string. You need to update the following values:

**Important**: Change these values for production:

```env
# MongoDB Connection (already configured)
MONGODB_URI=mongodb+srv://kalisa:%3CKigali20%40%3E@cluster0.bpji5nd.mongodb.net/art-marketplace?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Cloudinary Configuration - Add your credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Note**: The MongoDB connection string is already configured. Make sure to:
- Generate strong, random JWT secrets for production
- Add your Cloudinary credentials for image uploads

4. **Start the development server**

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── auth.controller.js    # Authentication logic
│   ├── artist.controller.js  # Artist profile management
│   ├── artwork.controller.js # Artwork CRUD operations
│   ├── comment.controller.js # Comment management
│   ├── like.controller.js    # Like functionality
│   ├── order.controller.js   # Order management
│   └── notification.controller.js # Notifications
├── middlewares/
│   ├── auth.middleware.js    # JWT authentication middleware
│   └── error.middleware.js   # Error handling
├── models/
│   ├── user.model.js         # User schema
│   ├── artist.model.js       # Artist profile schema
│   ├── artwork.model.js      # Artwork schema
│   ├── comment.model.js      # Comment schema
│   ├── like.model.js         # Like schema
│   ├── order.model.js        # Order schema
│   └── notification.model.js # Notification schema
├── routes/
│   ├── auth.routes.js        # Auth endpoints
│   ├── artist.routes.js      # Artist endpoints
│   ├── artwork.routes.js     # Artwork endpoints
│   ├── comment.routes.js     # Comment endpoints
│   ├── like.routes.js        # Like endpoints
│   ├── order.routes.js       # Order endpoints
│   └── notification.routes.js # Notification endpoints
├── utils/
│   ├── jwt.js                # JWT token utilities
│   ├── cloudinary.js         # Cloudinary configuration
│   └── notificationHelper.js # Notification helper functions
├── server.js                 # Main server file
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (Protected)

### Artist Profile

- `GET /api/artists/:id` - Get artist profile (Public)
- `PUT /api/artists/me` - Update artist profile (Protected - Artist only)
- `GET /api/artists/me/artworks` - Get artist's artworks (Protected - Artist only)
- `GET /api/artists/me/stats` - Get artist statistics (Protected - Artist only)

### Artworks

- `GET /api/artworks` - Get all artworks (Public, with filters)
- `GET /api/artworks/:id` - Get single artwork (Public)
- `POST /api/artworks` - Create artwork (Protected - Artist only)
- `PUT /api/artworks/:id` - Update artwork (Protected - Artist only)
- `DELETE /api/artworks/:id` - Delete artwork (Protected - Artist only)
- `POST /api/artworks/:id/upload` - Upload images (Protected - Artist only)

### Likes

- `POST /api/artworks/:id/like` - Toggle like (Protected)
- `GET /api/artworks/:id/like` - Check if user liked (Protected)

### Comments

- `GET /api/artworks/:id/comments` - Get comments (Public)
- `POST /api/artworks/:id/comments` - Add comment (Protected)
- `DELETE /api/comments/:id` - Delete comment (Protected)

### Orders

- `POST /api/orders` - Create order (Protected)
- `GET /api/orders/me` - Get user orders (Protected)
- `PUT /api/orders/:id/status` - Update order status (Protected - Artist only)

### Notifications

- `GET /api/notifications` - Get notifications (Protected)
- `PUT /api/notifications/:id/read` - Mark notification as read (Protected)
- `PUT /api/notifications/mark-read` - Mark all as read (Protected)
- `DELETE /api/notifications/:id` - Delete notification (Protected)

## 📝 Example API Requests

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "ARTIST"
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Artwork (Protected)

```bash
POST /api/artworks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Beautiful Landscape",
  "description": "A stunning landscape painting",
  "price": 50000,
  "currency": "RWF",
  "category": "Painting",
  "medium": "Oil on Canvas",
  "dimensions": "50x60 cm",
  "year": 2024,
  "images": ["https://example.com/image1.jpg"],
  "status": "PUBLISHED"
}
```

### Get Artworks with Filters

```bash
GET /api/artworks?page=1&limit=12&category=Painting&sort=popular
```

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

The token is obtained from the login endpoint and should be included in subsequent requests.

## 🗄️ Database Models

### User
- Basic user information with role-based access (ARTIST, BUYER, ADMIN)

### ArtistProfile
- Extended profile for artists with bio, location, social links, and statistics

### Artwork
- Artwork details including images, pricing, dimensions, and status

### Like
- Tracks user likes on artworks (unique constraint on artworkId + userId)

### Comment
- Supports nested comments with parentCommentId

### Order
- Order management with status tracking (PENDING, CONFIRMED, CANCELLED, COMPLETED)

### Notification
- Real-time notifications for likes, comments, and orders

## 🔔 Socket.io Integration

The server includes Socket.io for real-time updates:

- **Join Room**: `socket.on('join-room', userId)` - Join user's notification room
- **Like Updates**: `socket.on('like', data)` - Broadcast like updates
- **Comment Updates**: `socket.on('comment', data)` - Broadcast comment updates

## 🚀 Deployment

### Environment Variables

Make sure to set all environment variables in your production environment:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Strong secret for JWT tokens
- `JWT_REFRESH_SECRET` - Strong secret for refresh tokens
- `CLOUDINARY_*` - Cloudinary credentials
- `FRONTEND_URL` - Your frontend URL for CORS

### Production Tips

1. Use a strong JWT secret (at least 32 characters)
2. Enable MongoDB authentication
3. Use HTTPS in production
4. Set up proper CORS configuration
5. Use environment-specific configurations
6. Set up error logging and monitoring
7. Use Redis for caching (optional)

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cloudinary** - Image storage
- **socket.io** - Real-time communication
- **multer** - File upload handling
- **cors** - Cross-origin resource sharing

## 🐛 Error Handling

All errors are handled by the error middleware and return consistent JSON responses:

```json
{
  "success": false,
  "message": "Error message"
}
```

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.


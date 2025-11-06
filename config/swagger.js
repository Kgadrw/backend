import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'INDATWA ART API',
      version: '1.0.0',
      description: 'A comprehensive REST API for INDATWA ART marketplace platform built with Node.js, Express, and MongoDB. This API provides endpoints for managing artworks, artists, orders, cart, analytics, and more.',
      contact: {
        name: 'API Support',
        email: process.env.SUPPORT_EMAIL || 'support@indatwaart.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: process.env.API_URL || process.env.RENDER_EXTERNAL_URL || 'https://your-backend.onrender.com',
        description: 'Production server (Render)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your token (without Bearer prefix)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            role: {
              type: 'string',
              enum: ['ARTIST', 'BUYER', 'ADMIN'],
              description: 'User role',
              example: 'BUYER',
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: 'User avatar URL',
              example: 'https://example.com/avatar.jpg',
            },
            isVerified: {
              type: 'boolean',
              description: 'Email verification status',
              example: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
            },
          },
        },
        ArtistProfile: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Artist profile ID',
            },
            userId: {
              type: 'string',
              description: 'Associated user ID',
            },
            bio: {
              type: 'string',
              description: 'Artist biography',
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Artist website URL',
            },
            socialLinks: {
              type: 'object',
              properties: {
                instagram: { type: 'string' },
                twitter: { type: 'string' },
                facebook: { type: 'string' },
              },
            },
          },
        },
        Artwork: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Artwork ID',
            },
            artistId: {
              type: 'string',
              description: 'Artist user ID',
            },
            title: {
              type: 'string',
              description: 'Artwork title',
              example: 'Sunset Over Mountains',
            },
            description: {
              type: 'string',
              description: 'Artwork description',
            },
            price: {
              type: 'number',
              description: 'Artwork price',
              example: 299.99,
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri',
              },
              description: 'Array of image URLs',
            },
            category: {
              type: 'string',
              description: 'Artwork category',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Artwork tags',
            },
            isAvailable: {
              type: 'boolean',
              description: 'Availability status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Artists',
        description: 'Artist profile management endpoints',
      },
      {
        name: 'Artworks',
        description: 'Artwork management endpoints',
      },
      {
        name: 'Orders',
        description: 'Order management endpoints',
      },
      {
        name: 'Cart',
        description: 'Shopping cart endpoints',
      },
      {
        name: 'Likes',
        description: 'Artwork likes endpoints',
      },
      {
        name: 'Comments',
        description: 'Artwork comments endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification endpoints',
      },
      {
        name: 'Newsletter',
        description: 'Newsletter subscription endpoints',
      },
      {
        name: 'Analytics',
        description: 'Analytics and page view tracking endpoints',
      },
      {
        name: 'Reviews',
        description: 'Artwork review endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;


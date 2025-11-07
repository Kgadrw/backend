import express from 'express';
import {
  getArtworks,
  getArtwork,
  createArtwork,
  updateArtwork,
  deleteArtwork,
} from '../controllers/artwork.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { upload } from '../utils/cloudinary.js';
import { uploadDocument } from '../utils/documentUpload.js';
import Artwork from '../models/artwork.model.js';

const router = express.Router();

/**
 * @swagger
 * /api/artworks:
 *   get:
 *     summary: Get all artworks
 *     tags: [Artworks]
 *     description: Retrieve a list of artworks with optional filtering, sorting, and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: artistId
 *         schema:
 *           type: string
 *         description: Filter by artist ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [popular, newest, price-asc, price-desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of artworks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Artwork'
 *                     pagination:
 *                       type: object
 */
router.get('/', getArtworks);

/**
 * @swagger
 * /api/artworks/{id}:
 *   get:
 *     summary: Get single artwork
 *     tags: [Artworks]
 *     description: Retrieve a specific artwork by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Artwork ID
 *     responses:
 *       200:
 *         description: Artwork retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Artwork'
 *       404:
 *         description: Artwork not found
 */
router.get('/:id', getArtwork);

/**
 * @swagger
 * /api/artworks:
 *   post:
 *     summary: Create new artwork
 *     tags: [Artworks]
 *     description: Create a new artwork (Artist only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - images
 *             properties:
 *               title:
 *                 type: string
 *                 example: Sunset Over Mountains
 *               description:
 *                 type: string
 *                 example: A beautiful landscape painting
 *               price:
 *                 type: number
 *                 example: 299.99
 *               currency:
 *                 type: string
 *                 default: RWF
 *               category:
 *                 type: string
 *                 example: Landscape
 *               medium:
 *                 type: string
 *                 example: Oil on Canvas
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Artwork created successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Artist role required
 */
router.post('/', protect, authorize('ARTIST'), createArtwork);

/**
 * @swagger
 * /api/artworks/{id}:
 *   put:
 *     summary: Update artwork
 *     tags: [Artworks]
 *     description: Update an existing artwork (Artist only, owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, SOLD]
 *     responses:
 *       200:
 *         description: Artwork updated successfully
 *       403:
 *         description: Not authorized to update this artwork
 *       404:
 *         description: Artwork not found
 */
router.put('/:id', protect, authorize('ARTIST'), updateArtwork);

/**
 * @swagger
 * /api/artworks/{id}:
 *   delete:
 *     summary: Delete artwork
 *     tags: [Artworks]
 *     description: Delete an artwork (Artist only, owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artwork deleted successfully
 *       403:
 *         description: Not authorized to delete this artwork
 *       404:
 *         description: Artwork not found
 */
router.delete('/:id', protect, authorize('ARTIST'), deleteArtwork);

// Image upload route (optional - can be handled in frontend)
router.post('/:id/upload', protect, authorize('ARTIST'), upload.array('images', 5), async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }

    // Check if user owns the artwork
    if (artwork.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload images to this artwork' });
    }

    const imageUrls = req.files.map(file => file.path);
    artwork.images = [...artwork.images, ...imageUrls];
    await artwork.save();

    res.json({
      success: true,
      data: artwork,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ownership document upload route
router.post('/:id/ownership-document', protect, authorize('ARTIST'), uploadDocument.single('document'), async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ 
        success: false,
        message: 'Artwork not found' 
      });
    }

    // Check if user owns the artwork
    if (artwork.artistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to upload ownership document for this artwork' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Document file is required' 
      });
    }

    artwork.ownershipDocument = req.file.path;
    artwork.verificationStatus = 'PENDING';
    artwork.verificationNotes = null;
    artwork.verifiedAt = null;
    artwork.verifiedBy = null;
    await artwork.save();

    res.json({
      success: true,
      data: { 
        artwork: {
          _id: artwork._id,
          ownershipDocument: artwork.ownershipDocument,
        }
      },
      message: 'Ownership document uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Download ownership document (owner or admin only)
router.get('/:id/ownership-document', protect, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ 
        success: false,
        message: 'Artwork not found' 
      });
    }

    if (!artwork.ownershipDocument) {
      return res.status(404).json({ 
        success: false,
        message: 'Ownership document not found' 
      });
    }

    // Check if user is owner or admin
    const isOwner = artwork.artistId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to download this document' 
      });
    }

    // Redirect to Cloudinary URL for download
    res.json({
      success: true,
      data: {
        downloadUrl: artwork.ownershipDocument,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

export default router;


import express from 'express';
import {
  getComments,
  addComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/artworks/{id}/comments:
 *   get:
 *     summary: Get artwork comments
 *     tags: [Comments]
 *     description: Get all comments for an artwork (Public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 */
router.get('/artworks/:id/comments', getComments);

/**
 * @swagger
 * /api/artworks/{id}/comments:
 *   post:
 *     summary: Add comment to artwork
 *     tags: [Comments]
 *     description: Add a comment to an artwork
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 description: Parent comment ID for replies
 *     responses:
 *       201:
 *         description: Comment added successfully
 */
router.post('/artworks/:id/comments', protect, addComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Comments]
 *     description: Delete a comment (owner or admin only)
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
 *         description: Comment deleted successfully
 *       403:
 *         description: Not authorized to delete this comment
 */
router.delete('/comments/:id', protect, deleteComment);

export default router;


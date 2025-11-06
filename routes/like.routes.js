import express from 'express';
import { toggleLike, checkLike } from '../controllers/like.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/artworks/{id}/like:
 *   post:
 *     summary: Toggle like on artwork
 *     tags: [Likes]
 *     description: Like or unlike an artwork
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
 *         description: Like toggled successfully
 */
router.post('/artworks/:id/like', protect, toggleLike);

/**
 * @swagger
 * /api/artworks/{id}/like:
 *   get:
 *     summary: Check if user liked artwork
 *     tags: [Likes]
 *     description: Check if the authenticated user has liked an artwork
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
 *         description: Like status retrieved
 */
router.get('/artworks/:id/like', protect, checkLike);

export default router;


import express from 'express';
import { subscribeNewsletter, unsubscribeNewsletter } from '../controllers/newsletter.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Newsletter]
 *     description: Subscribe an email to the newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Successfully subscribed
 *       400:
 *         description: Invalid email or already subscribed
 */
router.post('/subscribe', subscribeNewsletter);

/**
 * @swagger
 * /api/newsletter/unsubscribe:
 *   post:
 *     summary: Unsubscribe from newsletter
 *     tags: [Newsletter]
 *     description: Unsubscribe an email from the newsletter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Successfully unsubscribed
 */
router.post('/unsubscribe', unsubscribeNewsletter);

export default router;


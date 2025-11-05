import express from 'express';
import { toggleLike, checkLike } from '../controllers/like.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/artworks/:id/like', protect, toggleLike);
router.get('/artworks/:id/like', protect, checkLike);

export default router;


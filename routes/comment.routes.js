import express from 'express';
import {
  getComments,
  addComment,
  deleteComment,
} from '../controllers/comment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/artworks/:id/comments', getComments);
router.post('/artworks/:id/comments', protect, addComment);
router.delete('/comments/:id', protect, deleteComment);

export default router;


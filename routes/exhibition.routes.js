import express from 'express';
import {
  getApprovedExhibitions,
  getExhibitionById,
  createExhibition,
  updateExhibition,
  deleteExhibition,
  getMyExhibitions,
} from '../controllers/exhibition.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getApprovedExhibitions);
router.get('/me', protect, authorize('ARTIST'), getMyExhibitions);
router.post('/', protect, authorize('ARTIST'), createExhibition);
router.put('/:id', protect, authorize('ARTIST'), updateExhibition);
router.delete('/:id', protect, authorize('ARTIST'), deleteExhibition);
router.get('/:id', getExhibitionById);

export default router;



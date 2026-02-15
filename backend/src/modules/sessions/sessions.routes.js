import { Router } from 'express';
import {
  createSessionHandler,
  deleteSessionHandler,
  listSessionsHandler,
  updateSessionHandler
} from './sessions.controller.js';

const router = Router();

router.get('/', listSessionsHandler);
router.post('/', createSessionHandler);
router.patch('/:id', updateSessionHandler);
router.delete('/:id', deleteSessionHandler);

export default router;

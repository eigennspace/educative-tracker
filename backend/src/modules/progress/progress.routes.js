import { Router } from 'express';
import {
  getCourseProgressHandler,
  toggleCourseProgressHandler
} from './progress.controller.js';

const router = Router({ mergeParams: true });

router.get('/', getCourseProgressHandler);
router.post('/toggle', toggleCourseProgressHandler);

export default router;

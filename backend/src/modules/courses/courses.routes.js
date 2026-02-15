import { Router } from 'express';
import {
  createCourseHandler,
  deleteCourseHandler,
  getCourseHandler,
  listCoursesHandler,
  updateCourseHandler
} from './courses.controller.js';

const router = Router();

router.get('/', listCoursesHandler);
router.post('/', createCourseHandler);
router.get('/:id', getCourseHandler);
router.patch('/:id', updateCourseHandler);
router.delete('/:id', deleteCourseHandler);

export default router;

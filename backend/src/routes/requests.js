import express from 'express';
import {
  listRequestsHandler,
  createRequestHandler,
  getRequestHandler,
  updateRequestHandler,
  deleteRequestHandler,
  updateRequestStatusHandler,
  addRequestProgressHandler,
  submitRequestReportHandler,
} from '../controllers/requestsController.js';
import { initAppState } from '../initState.js';
import { ensureAuth, ensureRole } from '../middleware/authMiddleware.js';
import { hasDatabase } from '../db/pool.js';

const router = express.Router();

// Inicializa o modo demonstrativo quando não há PostgreSQL configurado.
router.use((req, res, next) => {
  if (!hasDatabase() && !global.appState) initAppState();
  next();
});

router.use(ensureAuth);

router.get('/', ensureRole(['client', 'operator', 'admin']), listRequestsHandler);
router.post('/', ensureRole('client'), createRequestHandler);
router.get('/:id', ensureRole(['client', 'operator', 'admin']), getRequestHandler);
router.put('/:id', ensureRole(['client', 'operator', 'admin']), updateRequestHandler);
router.delete('/:id', ensureRole(['client', 'admin']), deleteRequestHandler);
router.post('/:id/status', ensureRole(['operator', 'admin']), updateRequestStatusHandler);
router.post('/:id/progress', ensureRole(['operator', 'admin']), addRequestProgressHandler);
router.post('/:id/report', ensureRole(['operator', 'admin']), submitRequestReportHandler);

export default router;

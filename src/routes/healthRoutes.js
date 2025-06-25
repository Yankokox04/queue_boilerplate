const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// GET /api/health - Basic health check
router.get('/', healthController.basicHealth);

// GET /api/health/detailed - Detailed health check including AWS services
router.get('/detailed', healthController.detailedHealth);

module.exports = router;
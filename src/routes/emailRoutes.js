const express = require('express');
const { validateEmailRequest } = require('../middleware/validation');
const emailController = require('../controllers/emailController');

const router = express.Router();

// POST /api/email/queue - Queue emails for processing
router.post('/queue', validateEmailRequest, emailController.queueEmails);

// GET /api/email/status/:jobId - Get job status (optional feature)
router.get('/status/:jobId', emailController.getJobStatus);

module.exports = router;
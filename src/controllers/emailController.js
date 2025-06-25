const { v4: uuidv4 } = require('uuid');
const sqsService = require('../services/sqsService');
const logger = require('../utils/logger');

class EmailController {
  async queueEmails(req, res) {
    try {
      const { artistIds, applicationIds, emailContent, metadata } = req.body;
      const jobId = uuidv4();

      logger.info(`Processing email queue request`, {
        jobId,
        artistCount: artistIds?.length || 0,
        applicationCount: applicationIds?.length || 0,
        hasContent: !!emailContent
      });

      // Create message payload
      const messagePayload = {
        jobId,
        artistIds: artistIds || [],
        applicationIds: applicationIds || [],
        emailContent,
        metadata: {
          ...metadata,
          requestTimestamp: new Date().toISOString(),
          source: 'api'
        }
      };

      // Send to SQS queue
      const messageId = await sqsService.sendMessage(messagePayload);

      logger.info(`Email job queued successfully`, {
        jobId,
        messageId,
        totalRecipients: (artistIds?.length || 0) + (applicationIds?.length || 0)
      });

      // Return immediate response
      res.status(200).json({
        success: true,
        message: 'Email job queued successfully',
        data: {
          jobId,
          messageId,
          estimatedRecipients: (artistIds?.length || 0) + (applicationIds?.length || 0),
          queuedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Failed to queue email job', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to queue email job',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;

      // TODO: Implement job status tracking
      // This would typically involve checking a database or cache
      // for job status information updated by the Lambda processor

      logger.info(`Job status requested`, { jobId });

      res.status(200).json({
        success: true,
        data: {
          jobId,
          status: 'queued', // placeholder - implement actual status tracking
          message: 'Job status tracking not yet implemented'
        }
      });

    } catch (error) {
      logger.error('Failed to get job status', {
        error: error.message,
        jobId: req.params.jobId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get job status'
      });
    }
  }
}

module.exports = new EmailController();
const AWS = require('aws-sdk');
const logger = require('../utils/logger');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const sqs = new AWS.SQS();

class HealthController {
  async basicHealth(req, res) {
    res.status(200).json({
      success: true,
      message: 'Email Queue Service is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  }

  async detailedHealth(req, res) {
    const healthChecks = {
      service: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {}
    };

    try {
      // Check SQS connectivity
      if (process.env.SQS_QUEUE_URL) {
        try {
          const queueAttributes = await sqs.getQueueAttributes({
            QueueUrl: process.env.SQS_QUEUE_URL,
            AttributeNames: ['ApproximateNumberOfMessages']
          }).promise();

          healthChecks.checks.sqs = {
            status: 'healthy',
            queueUrl: process.env.SQS_QUEUE_URL,
            messagesInQueue: queueAttributes.Attributes.ApproximateNumberOfMessages
          };
        } catch (error) {
          healthChecks.checks.sqs = {
            status: 'unhealthy',
            error: error.message
          };
          healthChecks.service = 'degraded';
        }
      } else {
        healthChecks.checks.sqs = {
          status: 'not_configured',
          message: 'SQS_QUEUE_URL not configured'
        };
      }

      // Check memory usage
      const memUsage = process.memoryUsage();
      healthChecks.checks.memory = {
        status: 'healthy',
        usage: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
        }
      };

      // Check uptime
      healthChecks.checks.uptime = {
        status: 'healthy',
        uptime: `${Math.round(process.uptime())}s`
      };

      const statusCode = healthChecks.service === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthChecks);

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      
      res.status(503).json({
        success: false,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
}

module.exports = new HealthController();
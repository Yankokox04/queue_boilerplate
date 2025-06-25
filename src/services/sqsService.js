const AWS = require('aws-sdk');
const logger = require('../utils/logger');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const sqs = new AWS.SQS();

class SQSService {
  constructor() {
    this.queueUrl = process.env.SQS_QUEUE_URL;
    this.dlqUrl = process.env.SQS_DLQ_URL;
  }

  async sendMessage(messageBody, options = {}) {
    try {
      if (!this.queueUrl) {
        throw new Error('SQS_QUEUE_URL not configured');
      }

      const params = {
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(messageBody),
        MessageAttributes: {
          JobType: {
            DataType: 'String',
            StringValue: 'email_processing'
          },
          Priority: {
            DataType: 'String',
            StringValue: options.priority || 'normal'
          },
          Source: {
            DataType: 'String',
            StringValue: 'api'
          }
        },
        ...options
      };

      const result = await sqs.sendMessage(params).promise();
      
      logger.info('Message sent to SQS', {
        messageId: result.MessageId,
        queueUrl: this.queueUrl
      });

      return result.MessageId;

    } catch (error) {
      logger.error('Failed to send message to SQS', {
        error: error.message,
        queueUrl: this.queueUrl,
        messageBody: typeof messageBody === 'object' ? JSON.stringify(messageBody) : messageBody
      });
      throw error;
    }
  }

  async sendBatchMessages(messages) {
    try {
      if (!this.queueUrl) {
        throw new Error('SQS_QUEUE_URL not configured');
      }

      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Messages must be a non-empty array');
      }

      if (messages.length > 10) {
        throw new Error('Cannot send more than 10 messages in a batch');
      }

      const entries = messages.map((message, index) => ({
        Id: `msg-${index}`,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          JobType: {
            DataType: 'String',
            StringValue: 'email_processing'
          },
          BatchIndex: {
            DataType: 'Number',
            StringValue: index.toString()
          }
        }
      }));

      const params = {
        QueueUrl: this.queueUrl,
        Entries: entries
      };

      const result = await sqs.sendMessageBatch(params).promise();
      
      logger.info('Batch messages sent to SQS', {
        successful: result.Successful?.length || 0,
        failed: result.Failed?.length || 0,
        queueUrl: this.queueUrl
      });

      return result;

    } catch (error) {
      logger.error('Failed to send batch messages to SQS', {
        error: error.message,
        queueUrl: this.queueUrl,
        messageCount: messages?.length
      });
      throw error;
    }
  }

  async getQueueAttributes() {
    try {
      if (!this.queueUrl) {
        throw new Error('SQS_QUEUE_URL not configured');
      }

      const params = {
        QueueUrl: this.queueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
          'ApproximateNumberOfMessagesNotVisible',
          'ApproximateNumberOfMessagesDelayed'
        ]
      };

      const result = await sqs.getQueueAttributes(params).promise();
      return result.Attributes;

    } catch (error) {
      logger.error('Failed to get queue attributes', {
        error: error.message,
        queueUrl: this.queueUrl
      });
      throw error;
    }
  }
}

module.exports = new SQSService();
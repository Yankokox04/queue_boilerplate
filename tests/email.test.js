const request = require('supertest');
const app = require('../src/server');

describe('Email API', () => {
  describe('POST /api/email/queue', () => {
    it('should queue email successfully with valid data', async () => {
      const emailData = {
        artistIds: ['123e4567-e89b-12d3-a456-426614174000'],
        emailContent: {
          subject: 'Test Email',
          htmlBody: '<h1>Hello {{name}}</h1>',
          textBody: 'Hello {{name}}'
        },
        metadata: {
          campaignId: 'test-campaign',
          priority: 'normal'
        }
      };

      const response = await request(app)
        .post('/api/email/queue')
        .send(emailData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBeDefined();
      expect(response.body.data.estimatedRecipients).toBe(1);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        emailContent: {
          subject: 'Test Email'
          // missing htmlBody
        }
      };

      const response = await request(app)
        .post('/api/email/queue')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when no recipients provided', async () => {
      const noRecipientsData = {
        emailContent: {
          subject: 'Test Email',
          htmlBody: '<h1>Hello</h1>'
        }
      };

      const response = await request(app)
        .post('/api/email/queue')
        .send(noRecipientsData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/email/status/:jobId', () => {
    it('should return job status', async () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/email/status/${jobId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe(jobId);
    });
  });
});
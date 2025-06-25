const request = require('supertest');
const app = require('../src/server');

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email Queue Service is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body.service).toBeDefined();
      expect(response.body.checks).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
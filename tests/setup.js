// Test setup file
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock AWS SDK for tests
jest.mock('aws-sdk', () => ({
  SQS: jest.fn(() => ({
    sendMessage: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve({ MessageId: 'mock-message-id' }))
    })),
    getQueueAttributes: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve({
        Attributes: { ApproximateNumberOfMessages: '0' }
      }))
    }))
  })),
  config: {
    update: jest.fn()
  }
}));
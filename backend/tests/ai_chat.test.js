const request = require('supertest');
const app = require('../app');

jest.mock('../third_party/chatgpt', () => {
  return {
    getInstance: jest.fn().mockReturnValue({
      getAIResponse: jest.fn().mockImplementation((conversation) => {
        return Promise.resolve({ data: 'Mock response' });
      }),
      getNearbyPOIList: jest.fn().mockImplementation((latitude, longitude) => {
        return Promise.resolve(['POI1', 'POI2', 'POI3', 'POI4', 'POI5']);
      })
    })
  };
});

describe('API tests', () => {
    test('try to chat without authentication should fail', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({conversation: [{content: 'Hello'}]});

      expect(response.statusCode).toBe(401);
    });

    test('try to get nearby POI without authentication should fail', async () => {
      const response = await request(app)
        .post('/api/ai/nearby')
        .send({latitude: 0, longitude: 0});

      expect(response.statusCode).toBe(401);
    });
  });

const request = require("supertest");
const app = require("../app");

jest.mock("../third_party/chatgpt", () => {
  return {
    getInstance: jest.fn().mockReturnValue({
      getAIResponse: jest.fn().mockImplementation((conversation) => {
        return Promise.resolve("Mock response");
      }),
    }),
  };
});

jest.mock('../middlewares/auth', () => ({
  verifyAuthentication: (req, res, next) => {
    if (req.headers.authentication) {
      req.user = { id: 'mockUserId', role: 'mockUserRole' };
      next();
    } else {
      res.status(401).json({ message: 'Authentication token not provided' });
    }
  },
}));

describe("API tests without authentication", () => {
  test("try to chat without authentication should fail", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .send({ conversation: [{ content: "Hello" }] });

    expect(response.statusCode).toBe(401);
  });
});

describe("API tests with authentication", () => {
  const authToken = "test_token";

  test("chat with authentication should succeed", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .set('Content-Type', 'application/json')
      .set('authentication', authToken)
      .send({ conversation: [{ role: 'user', content: `I'm a tourist at the Eiffel Tower. Please give me a short guide.` }] });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('response');
    expect(response.body.response).toBe("Mock response");
  });
});


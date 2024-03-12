const request = require("supertest");
const app = require("../app");

jest.mock('../third_party/db', () => {
  const forums = [
    { id: '1', data: () => ({ name: 'POI 1', lat: 10.001, lon: 10.001 }) },
    { id: '2', data: () => ({ name: 'POI 2', lat: 10.002, lon: 10.002 }) },
  ];

  return {
    getInstance: jest.fn().mockReturnValue({
      getDatabase: jest.fn(() => ({
        collection: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: forums }),
      })),
    }),
  };
});

jest.mock('../middlewares/auth', () => ({
    verifyAuthentication: (req, res, next) => {
        if (req.headers.authentication) {
          req.user = { id: "mockUserId", role: "mockUserRole" };
          next();
        } else {
          res.status(401).json({ message: "Authentication token not provided" });
        }
    },
}));

describe("Nearby API tests without authentication", () => {
  test("Get nearby without authentication should fail", async () => {
    const latitude = 10.001;
    const longitude = 10.001;

    const response = await request(app)
      .post("/api/nearby/")
      .send({ latitude, longitude });

    expect(response.statusCode).toBe(401);
  });
});

describe("Nearby API tests with authentication", () => {
    const authToken = "test_token";

    test("Get nearby with authentication should succeed", async () => {
      const latitude = 10.001;
      const longitude = 10.001;

      const response = await request(app)
        .post("/api/nearby/")
        .set("authentication", authToken)
        .send({ latitude, longitude });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name', 'POI 1');
      expect(response.body[1]).toHaveProperty('name', 'POI 2');
    });
  });

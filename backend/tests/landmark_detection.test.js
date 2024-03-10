const request = require("supertest");
const app = require("../app");
const path = require("path");
const fs = require("fs");

jest.mock("../third_party/google_lens", () => {
  return {
    getInstance: jest.fn().mockReturnValue({
      detectLandmark: jest.fn().mockImplementation((filePath) => {
        return Promise.resolve({
          landmarkAnnotations: [
            {
              description: "Eiffel Tower",
              locations: [{ latLng: { latitude: 48.8584, longitude: 2.2945 } }],
            },
          ],
        });
      }),
    }),
  };
});

jest.mock("../third_party/db", () => {
  const mockLimit = jest.fn().mockReturnThis();
  const mockWhere = jest.fn().mockReturnThis();
  const mockGet = jest.fn();

  mockGet.mockResolvedValue({
    empty: true,
    docs: [
      {
        id: "mockForumDocId",
        data: () => ({ name: "Mock Forum", totalScore: 0, totalUsers: 0 }),
      },
    ],
  });

  const firestoreMock = {
    collection: jest.fn().mockReturnThis(),
    where: mockWhere,
    limit: mockLimit,
    get: mockGet,
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue({ id: "mockNewDocId" }),
  };

  return {
    getInstance: jest.fn().mockReturnValue({
      getDatabase: jest.fn(() => firestoreMock),
    }),
  };
});

jest.mock("../middlewares/auth", () => ({
    verifyAuthentication: (req, res, next) => {
        if (req.headers.authentication) {
          req.user = { id: "mockUserId", role: "mockUserRole" };
          next();
        } else {
          res.status(401).json({ message: "Authentication token not provided" });
        }
    },
}));

describe("Landmark Detection API tests without authentication", () => {
    const authToken = "test_token";

    test("detect landmark without authentication should fail", async () => {
      const testImage = path.join(__dirname, "test_image.jpg");
      fs.writeFileSync(testImage, "fake_image_data");

      const response = await request(app)
        .post("/api/landmark/detect")
        .set("Content-Type", "multipart/form-data")
        .attach("image", testImage)
        .field("latitude", "48.8584")
        .field("longitude", "2.2945");

      fs.unlinkSync(testImage);

      expect(response.statusCode).toBe(401);
    });
  });

describe("Landmark Detection API tests with authentication and file upload", () => {
  const authToken = "test_token";

  test("detect landmark with authentication and file upload should succeed", async () => {
    const testImage = path.join(__dirname, "test_image.jpg");
    fs.writeFileSync(testImage, "fake_image_data");

    const response = await request(app)
      .post("/api/landmark/detect")
      .set("Content-Type", "multipart/form-data")
      .set("authentication", authToken)
      .attach("image", testImage)
      .field("latitude", "48.8584")
      .field("longitude", "2.2945");

    fs.unlinkSync(testImage);

    expect(response.statusCode).toBe(200);
    expect(response.body.landmarks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ landmark: "Eiffel Tower" }),
      ])
    );
  });
});

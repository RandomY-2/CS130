const request = require("supertest");
const app = require("../app");

jest.mock("../third_party/db", () => {
  const mockGet = jest.fn();
  const mockAdd = jest.fn();
  const mockSet = jest.fn();
  const mockUpdate = jest.fn();

  const docs = [
    { id: "accessibleForumId", exists: true, data: () => ({}) },
  ];

  return {
    getInstance: jest.fn().mockReturnValue({
      getDatabase: jest.fn(() => ({
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: mockGet.mockResolvedValue({
          docs,
          exists: true,
          data: () => ([{ totalScore: 10, totalUsers: 2 }]),
        }),
        add: mockAdd.mockResolvedValue({ id: "newCommentId" }),
        set: mockSet,
        update: mockUpdate,
        where: jest.fn().mockReturnThis(),
      })),
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

describe("Forum API Endpoints without authentication", () => {
    const authToken = "test_token";

    test("Get accessible forums for authenticated user without authentication should fail", async () => {
      const response = await request(app)
        .get("/api/forum/forum")

      expect(response.statusCode).toBe(401);
    });

    test("Add a new comment to a specific forum without authentication should fail", async () => {
      const response = await request(app)
        .post("/api/forum/addComment")
        .send({ forumId: "forumId", content: "This is a test comment." })

      expect(response.statusCode).toBe(401);
    });

    test("Add or update a forum rating without authentication should fail", async () => {
      const response = await request(app)
        .post("/api/forum/rate")
        .send({ forumId: "forumId", rating: 5 })

      expect(response.statusCode).toBe(401);
    });
  });

describe("Forum API Endpoints", () => {
  const authToken = "test_token";

  test("Get accessible forums for authenticated user", async () => {
    const response = await request(app)
      .get("/api/forum/forum")
      .set('authentication', authToken)

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessibleForums");
    expect(response.body.accessibleForums).toContain("accessibleForumId");
  });

  test("Add a new comment to a specific forum", async () => {
    const response = await request(app)
      .post("/api/forum/addComment")
      .send({ forumId: "forumId", content: "This is a test comment." })
      .set('authentication', authToken)

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Comment added successfully"
    );
  });

  test("Add or update a forum rating", async () => {
    const response = await request(app)
      .post("/api/forum/rate")
      .send({ forumId: "forumId", rating: 5 })
      .set('authentication', authToken)

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "Rating added/updated successfully"
    );
  });
});

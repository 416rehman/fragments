const request = require("supertest");
const app = require("../../src/app");

describe("404 handler", () => {
  test("unknown subroute returns 404", async () => {
    return request(app).get("/unknown").expect(404);
  });
});

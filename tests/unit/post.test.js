const request = require("supertest");
const app = require("../../src/app");

const authEmail = "user1@email.com";
const authPassword = "password1";

describe("POST /v1/fragments", () => {
  // Invalid authentication
  test("should return 401 if authentication is invalid", () =>
    request(app).post("/v1/fragments").auth("invalid", "invalid").expect(401));

  // Missing authentication
  test("should return 401 if authentication is missing", () =>
    request(app).post("/v1/fragments").expect(401));

  // Test case: Missing body
  test("should return 400 if request body is missing", () =>
    request(app)
      .post("/v1/fragments")
      .auth(authEmail, authPassword)
      .set("Content-Type", "text/plain")
      .expect(400)
      .then((response) => {
        expect(response.body.status).toBe("error");
        expect(response.body.error.code).toBe(400);
        expect(response.body.error.message).toBe("Missing body");
      }));

  // Test case: Unsupported Media Type
  test("should return 415 if Content-Type is unsupported", () =>
    request(app)
      .post("/v1/fragments")
      .auth(authEmail, authPassword)
      .set("Content-Type", "unsupported/type")
      .send("sample body")
      .expect(415)
      .then((response) => {
        expect(response.body.status).toBe("error");
        expect(response.body.error.code).toBe(415);
        expect(response.body.error.message).toMatch(
          /Unsupported Media Type. Valid types are: /
        );
      }));

  // Test case: Successfully create a fragment
  test("should return 201 if fragment is successfully created", () => {
    const body = "sample body";
    const type = "text/plain";

    request(app)
      .post("/v1/fragments")
      .auth(authEmail, authPassword)
      .set("Content-Type", type)
      .send(body)
      .expect(201)
      .then((response) => {
        expect(response.body.status).toBe("ok");
        expect(response.body.fragment).toBeDefined();
        expect(response.body.fragment.type).toBe(type);
        expect(response.body.fragment.size).toBe(body.length);
      });
  });

  // Test case: Body size is greater than 10MB
  test("should return 413 if body size is greater than 10MB", () =>
    request(app)
      .post("/v1/fragments")
      .auth(authEmail, authPassword)
      .set("Content-Type", "text/plain")
      .send("sample body".repeat(1000000))
      .expect(413));
});

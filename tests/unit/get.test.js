// tests/unit/get.test.js
const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../src/response");
const { convert } = require("../../src/utils/helpers");
const crypto = require("crypto");

const authEmail = "user1@email.com";
const authPassword = "password1";

const fragmentBody = "sample body";
const fragmentType = "text/markdown";

let ownedFragment;
let otherFragment;
beforeAll(async () => {
  const ownerId = crypto.createHash("sha256").update(authEmail).digest("hex")
  ownedFragment = await db.create(fragmentBody, fragmentType, ownerId);
  const otherOwnerId = crypto.createHash("sha256").update("user2@email.com").digest("hex")
  otherFragment = await db.create(fragmentBody, fragmentType, otherOwnerId);
});


describe("GET /v1/fragments", () => {
  // If the request is missing the Authorization header, it should be forbidden
  test("unauthenticated requests are denied", () =>
    request(app).get("/v1/fragments").expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test("incorrect credentials are denied", () =>
    request(app)
      .get("/v1/fragments")
      .auth("invalid@email.com", "incorrect_password")
      .expect(401));

  // GET /v1/fragments/
  describe("GET /v1/fragments/", () => {
    test("should return an array of owned fragments' IDs when not expanded", async () => {
      const res = await request(app)
        .get("/v1/fragments/")
        .auth(authEmail, authPassword)
        .expect(200);

      expect(res.body).toEqual(
        createSuccessResponse({ fragments: [ownedFragment.id] })
      );
    });

    test("should return an array of owned fragments' metadata when expanded", async () => {
      const res = await request(app)
        .get("/v1/fragments/?expand=1")
        .auth(authEmail, authPassword)
        .expect(200);

      expect(res.body).toEqual(
        createSuccessResponse({ fragments: [ownedFragment] })
      );
    });
  });

  // GET /v1/fragments/:id
  describe("GET /v1/fragments/:id", () => {
    test("should return 404 if fragment does not exist", async () => {
      const nonExistentId = "nonexistentid";
      const res = await request(app)
        .get(`/v1/fragments/${nonExistentId}`)
        .auth(authEmail, authPassword)
        .expect(404);

      expect(res.body).toEqual(createErrorResponse(404, "Fragment not found"));
    });

    test("should return the fragment data if it exists", async () => {
      const res = await request(app)
        .get(`/v1/fragments/${ownedFragment.id}`)
        .auth(authEmail, authPassword)
        .expect(200);

      expect(res.text).toEqual(fragmentBody);
    });

    test("should not return the data if the fragment is not owned by the user", async () => {
      const res = await request(app)
        .get(`/v1/fragments/${otherFragment.id}`)
        .auth(authEmail, authPassword)
        .expect(404);

      expect(res.body).toEqual(createErrorResponse(404, "Fragment not found"));
    });

    test("should return 415 if unsupported conversion requested", async () => {
      const extension = "mp4";
      const res = await request(app)
        .get(`/v1/fragments/${ownedFragment.id}.${extension}`)
        .auth(authEmail, authPassword)
        .expect(415);

      // the error message should contain "Unsupported conversion"
      expect(res.body.error.message).toMatch(/Unsupported conversion/);
    });

    test("should return the converted fragment data if conversion is supported", async () => {
      const supportedExtension = "html";
      const res = await request(app)
        .get(`/v1/fragments/${ownedFragment.id}.${supportedExtension}`)
        .auth(authEmail, authPassword)
        .expect(200);

      const conversionResult = await convert(
        fragmentBody,
        fragmentType,
        supportedExtension
      );
      if (conversionResult.success) {
        expect(res.text).toEqual(conversionResult.data);
      } else {
        expect(res.body.error.message).toMatch(/Unsupported conversion/);
      }
    });
  });

  // GET /v1/fragments/:id/info
  describe("GET /v1/fragments/:id/info", () => {
    test("should return 404 if fragment does not exist", async () => {
      const nonExistentId = "nonexistentid";
      const res = await request(app)
        .get(`/v1/fragments/${nonExistentId}/info`)
        .auth(authEmail, authPassword)
        .expect(404);

      expect(res.body).toEqual(createErrorResponse(404, "Fragment not found"));
    });

    test("should return the owned fragment info if it exists", async () => {
      const res = await request(app)
        .get(`/v1/fragments/${ownedFragment.id}/info`)
        .auth(authEmail, authPassword)
        .expect(200);

      expect(res.body).toEqual(
        createSuccessResponse({
          fragment: {
            metadata: ownedFragment,
          },
        })
      );
    });
  });
});
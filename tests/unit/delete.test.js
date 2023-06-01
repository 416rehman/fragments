const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db/inmemoryDB.js");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("../../src/response");

// CONSTANTS
const authEmail = "user1@email.com";
const authPassword = "password1";
const fragmentBody = "sample body";
const fragmentType = "text/markdown";
const ownedFragment = db.create(fragmentBody, fragmentType, authEmail);
const otherFragment = db.create(fragmentBody, fragmentType, "user2@email.com");

describe("DELETE /v1/fragments/:id", () => {
  // If the request is missing the Authorization header, it should be forbidden
  test("unauthenticated requests are denied", () =>
    request(app).delete(`/v1/fragments/${ownedFragment.id}`).expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test("incorrect credentials are denied", () =>
    request(app)
      .delete(`/v1/fragments/${ownedFragment.id}`)
      .auth("invalid@email.com", "incorrect_password")
      .expect(401));

  test("should return 404 if fragment does not exist", async () => {
    const nonExistentId = "nonexistentid";
    const res = await request(app)
      .delete(`/v1/fragments/${nonExistentId}`)
      .auth(authEmail, authPassword);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(createErrorResponse(404, "Fragment not found"));
  });

  test("should return 200 and delete the fragment if it exists", async () => {
    const res = await request(app)
      .delete(`/v1/fragments/${ownedFragment.id}`)
      .auth(authEmail, authPassword);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(createSuccessResponse());
    // Ensure the fragment is deleted from the database
    expect(db.get(ownedFragment.id, authEmail)).toBeNull();
  });

  test("should return 404 if trying to delete a fragment owned by another user", async () => {
    const res = await request(app)
      .delete(`/v1/fragments/${otherFragment.id}`)
      .auth(authEmail, authPassword);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(createErrorResponse(404, "Fragment not found"));
    // Ensure the fragment owned by another user is not deleted from the database
    expect(db.get(otherFragment.id, "user2@email.com")).not.toBeNull();
  });
});

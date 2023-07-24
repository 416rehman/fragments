const request = require("supertest");
const app = require("../../src/app");
const db = require("../../src/db");
const {
  createErrorResponse,
} = require("../../src/response");

// CONSTANTS
const authEmail = "user1@email.com";
const authPassword = "password1";
const fragmentBody = "sample body";
const fragmentType = "text/markdown";
const ownedFragment = db.create(fragmentBody, fragmentType, authEmail);
const otherFragment = db.create(fragmentBody, fragmentType, "user2@email.com");

const updatedFragmentBody = "updated body";

describe("PUT /v1/fragments/:id", () => {
  // If the request is missing the Authorization header, it should be forbidden
  test("unauthenticated requests are denied", () =>
    request(app).put(`/v1/fragments/${ownedFragment.id}`).expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test("incorrect credentials are denied", () =>
    request(app)
      .put(`/v1/fragments/${ownedFragment.id}`)
      .auth("invalid@email.com", "incorrect_password")
      .expect(401));

  test("should return 404 if fragment does not exist", async () => {
    const nonExistentId = "nonexistentid";
    const res = await request(app)
      .put(`/v1/fragments/${nonExistentId}`)
      .auth(authEmail, authPassword)
      .send(updatedFragmentBody)
      .expect(404);

    expect(res.body).toEqual(createErrorResponse(404, "Fragment not found"));
  });

  test("should return 400 if Content-Type header does not match", async () => {
    const res = await request(app)
      .put(`/v1/fragments/${ownedFragment.id}`)
      .auth(authEmail, authPassword)
      .set("Content-Type", "application/json")
      .send(updatedFragmentBody)
      .expect(400);

    expect(res.body).toEqual(
      createErrorResponse(400, "Content-Type cannot be changed after creation")
    );
  });

  test("should return 400 if request body is missing", async () => {
    const res = await request(app)
      .put(`/v1/fragments/${ownedFragment.id}`)
      .auth(authEmail, authPassword)
      .set("Content-Type", fragmentType)
      .expect(400);

    expect(res.body).toEqual(createErrorResponse(400, "Missing body"));
  });

  test("should return 500 if failed to update fragment", async () => {
    // Mock the update function to return null, simulating a failed update
    // https://stackoverflow.com/questions/50091438/jest-how-to-mock-one-specific-method-of-a-class
    const spy = jest
      .spyOn(db, "update")
      .mockImplementation(() => null);
    const res = await request(app)
      .put(`/v1/fragments/${ownedFragment.id}`)
      .auth(authEmail, authPassword)
      .set("Content-Type", fragmentType)
      .send(updatedFragmentBody)
      .expect(500);

    expect(res.body).toEqual(
      createErrorResponse(500, "Failed to update fragment")
    );
    spy.mockRestore();
  });

  test("should return 200 with updated fragment if update is successful", async () => {
    const updatedFragmentBody = "updated body";
    const res = await request(app)
      .put(`/v1/fragments/${ownedFragment.id}`)
      .auth(authEmail, authPassword)
      .set("Content-Type", fragmentType)
      .send(updatedFragmentBody)
      .expect(200);

    expect(res.body.fragment.size).toEqual(updatedFragmentBody.length);
    expect(res.body.fragment.type).toEqual(fragmentType);
  });

  test("should return 400 if content type is different", async () => {
    const res = await request(app)
      .put(`/v1/fragments/${ownedFragment.id}`)
      .auth(authEmail, authPassword)
      .set("Content-Type", "application/json")
      .send(updatedFragmentBody)
      .expect(400);

    expect(res.body).toEqual(
      createErrorResponse(400, "Content-Type cannot be changed after creation")
    );
  });

  test("should return 404 if fragment does not belong to user", async () => {
    const res = await request(app)
      .put(`/v1/fragments/${otherFragment.id}`)
      .auth(authEmail, authPassword)
      .set("Content-Type", fragmentType)
      .send(updatedFragmentBody)
      .expect(404);

    expect(res.body).toEqual(createErrorResponse(404, "Fragment not found"));
  });
});
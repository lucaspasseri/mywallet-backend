import supertest from 'supertest';
import app from '../app.js';
import connection from '../database.js';

describe("GET /banana", () => {
    it("returns status 200 for valid params", async () => {
        const result = await supertest(app).get("/");
        expect(result.status).toEqual(200);
    });
});
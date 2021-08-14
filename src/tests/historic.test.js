/* eslint-disable no-undef */
import "../setup.js";
import supertest from "supertest";
import app from "../app.js";
import connection from "../database.js";

import { login } from "./utils.js";

beforeEach(async () => {
	await connection.query("DELETE FROM transactions");
});

describe("POST /historic/:op", () => {
	it("returns 404 when route is wrong.", async () => {
       
		const result = await supertest(app).post("/hystoric/");

		expect(result.status).toEqual(404);
	});
	it("returns 404 when no params is sended.", async () => {
       
		const result = await supertest(app).post("/historic/");

		expect(result.status).toEqual(404);
	});
	it("returns 401 when token is invalid.", async () => {

		const token = "invalid_token";
       
		const result = await supertest(app).post("/historic/c").set("Authorization", `Bearer ${token}`);

		expect(result.status).toEqual(401);
	});
	it("returns 400 when body is invalid.", async () => {

		const token = await login();
       
		const result = await supertest(app).post("/historic/c").set("Authorization", `Bearer ${token}`);

		expect(result.status).toEqual(400);
	});
	it("returns 501 when body.amount.length > 9.", async () => {

		const token = await login();

		const body = {
			"amount": 9999999999,
			"description": "É pq é"
		};
       
		const result = await supertest(app)
			.post("/historic/c")
			.send(body)
			.set("Authorization", `Bearer ${token}`);

		expect(result.status).toEqual(501);
	});
	it("returns 201 when token and body are valid.", async () => {

		const token = await login();

		const body = {
			"amount": 1000,
			"description": "É pq é"
		};
       
		const result = await supertest(app)
			.post("/historic/c")
			.send(body)
			.set("Authorization", `Bearer ${token}`);

		expect(result.status).toEqual(201);
	});
});

describe("GET /historic", () => {
	it("returns 404 when route is wrong.", async () => {
       
		const result = await supertest(app).get("/hystoric");

		expect(result.status).toEqual(404);
	});
	it("returns 401 when token is invalid.", async () => {
       
		const result = await supertest(app).get("/historic");

		expect(result.status).toEqual(401);
	});
	it("returns 200 when token is valid.", async () => {
       
		const token = await login();
       
		const result = await supertest(app).get("/historic").set("Authorization", `Bearer ${token}`);
		expect(result.status).toEqual(200);
	});
	it("returns a object like { transactions: [], balance: '0,00', balanceStatus: 'zero' } when token is valid.", async () => {
       
		const token = await login();
       
		const result = await supertest(app).get("/historic").set("Authorization", `Bearer ${token}`);
		expect(result.body).toEqual({ transactions: [], balance: "0,00", balanceStatus: "zero" });
	});

});

afterAll(() => {
	connection.end();
});
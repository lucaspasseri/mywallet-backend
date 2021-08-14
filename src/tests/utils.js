import supertest from "supertest";

import app from "../app.js";

export async function login(){

	await supertest(app).post("/signup").send({ 
		name: "Fulano",
		email: "fulano@email.com", 
		password: "123456",
		rePassword: "123456"
	});
	const user = await supertest(app).post("/signin").send({ email: "fulano@email.com", password: "123456" });

	return user.body.token;
}
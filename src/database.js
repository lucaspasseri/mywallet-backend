/* eslint-disable no-undef */
import pg from "pg";

const databaseConfig = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	ssl: {
		rejectUnauthorized: false
	}
};

const { Pool } = pg;
const connection = new Pool(databaseConfig);

export default connection;

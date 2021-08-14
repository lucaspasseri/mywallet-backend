/* eslint-disable no-undef */
import pg from "pg";

const databaseConfig = {
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false
	}
};

const { Pool } = pg;
const connection = new Pool(databaseConfig);

export default connection;

import pg from 'pg';

const databaseConfig = {
    user: 'postgres',
    password: '123456',
    database: 'my_wallet',
    host: 'localhost',
    port: 5432
};

const { Pool } = pg;
const connection = new Pool(databaseConfig);

export default connection;

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

import {newUserSchema} from './schemas/signupSchema.js';

const app = express();

app.use(express.json());
app.use(cors());

const databaseConfig = {
    user: 'postgres',
    password: '123456',
    database: 'my_wallet',
    host: 'localhost',
    port: 5432
};

const { Pool } = pg;
const connection = new Pool(databaseConfig);

app.get("/validsession", async (req, res) => {
    try {

        const sessions = await connection.query(
            `SELECT * FROM sessions`
        );

        console.log(sessions.rows);

        const authorization = req.header("Authorization");
        console.log(authorization);
        const token = authorization?.replace("Bearer ", "");
        console.log(token);

        if(!token) return res.sendStatus(401);
        
        const result = await connection.query(  
            `SELECT * FROM sessions
            JOIN users ON sessions."userId" = users.id
            WHERE sessions.token = $1`, [token]
        );
        
        const user = result.rows[0];
        console.log(user);

        if(user){
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }

    } catch(e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await connection.query(
            `SELECT * 
            FROM users 
            WHERE email = $1`,
            [email]
        );
        
        if(result.rows.length === 0) return res.sendStatus(400);

        const user = result.rows[0];

        console.log(user);
        console.log(user.hash);
        console.log(bcrypt.compareSync(password, user.hash));

        if(user && bcrypt.compareSync(password, user.hash)){
            const token = uuid();

            await connection.query(
                `INSERT INTO sessions ("userId", token)
                VALUES ($1, $2)`, [user.id, token]
            );

            res.send({
                id: user.id,
                name: user.name,
                token: token
            });
        }
        else {
            res.sendStatus(401);
        }
        
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});


app.post("/signup", async (req, res)=> {
    try {
        const { name, email, password, rePassword } = req.body;

        const errors = newUserSchema.validate(req.body).error;

        if(errors) return res.sendStatus(400);

        const hash = bcrypt.hashSync(password, 12);

        const result = await connection.query(
            `SELECT * FROM users
            WHERE email = $1`,
            [email]
        );

        if(result.rows.length === 0){
            await connection.query(`
                INSERT INTO users 
                (name, email, hash)
                VALUES ($1, $2, $3)`,
                [name, email, hash]
            );  

            res.sendStatus(201);
        } else {
            res.sendStatus(409);
        }
        
    } catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

app.post("/", (req, res) => {
    const { name, email, password, rePassword } = req.body; 
    console.log(req.body);
    console.log(name);
    res.send(req.body);
});

app.listen(4000, () => {
    console.log("Running on port 4000...");
});

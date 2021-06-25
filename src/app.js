import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

import {newUserSchema} from './schemas/signupSchema.js';
import { signinSchema } from './schemas/signinSchema.js';
import { transactionsSchema } from './schemas/transactionsSchema.js';
import connection from './database.js';

const app = express();

app.use(express.json());
app.use(cors());

app.delete("/session", async (req, res)=> {
    try {
        const authorization = req.header("Authorization");
        const token = authorization.replace("Bearer ", "");

        const existUser = await connection.query(
            `SELECT * FROM sessions
            JOIN users ON sessions."userId" = users.id
            WHERE sessions.token = $1`, [token]
        );

        const user = existUser.rows[0];
        if(user){
            await connection.query(
                `DELETE FROM sessions 
                WHERE "userId" = $1`,
                [user.id]
            );
            res.sendStatus(200);
        }
    } catch(e) {
        console.log(e);
        res.sendStatus(500);
    }
});

app.post("/historic/:op", async (req, res) => {
    try {
        const authorization = req.header("Authorization");
        const token = authorization?.replace("Bearer ", "");

        const existUser = await connection.query(
            `SELECT * FROM sessions
            JOIN users ON sessions."userId" = users.id
            WHERE sessions.token = $1`, [token]
        );

        const user = existUser.rows[0];
        if(user){
            const errors = transactionsSchema.validate(req.body).error;

            if(errors) return res.sendStatus(400);

            const {amount, description} = req.body;
            const {op} = req.params;

            let categoryId; 
            if(op === "c"){
                categoryId = 1; 
            } else if(op ==="d") {
                categoryId = 2;
            } else {
                return res.sendStatus(400);
            }

            await connection.query(
                `INSERT INTO transactions 
                ("userId", "categoryId", "eventDate", description, amount)
                VALUES ($1, $2, $3, $4, $5)`,
                [user.id, categoryId, Date.now(), description, amount ]
            );
            
            res.sendStatus(201);
        } else {
            res.sendStatus(401);
        }

    } catch(e) {

        if(e.message.indexOf(`is out of range for type integer`) !== -1){
            res.sendStatus(501);
        }else {
            res.sendStatus(500);
        }
    }      
});

app.get("/historic", async (req, res) => {
    try {

        const authorization = req.header("Authorization");
        const token = authorization?.replace("Bearer ", "");

        const existUser = await connection.query(
            `SELECT * FROM sessions
            JOIN users ON sessions."userId" = users.id
            WHERE sessions.token = $1`, [token]
        );
        
        const user = existUser.rows[0];
        if(user){
            const result = await connection.query(
                `SELECT * FROM transactions
                JOIN users ON transactions."userId" = users.id
                WHERE users.id = $1`, [user.id]  
            );                            

            const transactions = result.rows;
            let balanceCents = 0;

            if(transactions.length>0){
                balanceCents = transactions.reduce((acc, t) => {
                    if(t.categoryId === 1){
                        return acc + t.amount;
                    } else {
                        return acc - t.amount;
                    }
                    
                }, 0);
            }
    
            let balanceStatus;
            if(balanceCents > 0){
                balanceStatus="positive";
            } else if (balanceCents<0){
                balanceStatus="negative";
            } else {
                balanceStatus="zero";
            }

            let balance;

            if(balanceCents <= -100 || balanceCents>= 100){
                const sBalance = String(balanceCents);
                const integerPart = sBalance.substring(0,sBalance.length-2);
                const decimalPart = sBalance.substring(sBalance.length-2,sBalance.length);
                balance = integerPart+","+decimalPart;

            } else {
                if(balanceCents <= -10 || balanceCents >= 10){
                    if(balanceCents<0){
                        balance = "-0,"+Math.abs(balanceCents);
                    }
                    else {
                        balance = "0,"+balanceCents;
                    }
                } else {
                    if(balanceCents<0){
                        balance = "-0,0"+Math.abs(balanceCents);
                    }
                    else {
                        balance = "0,0"+balanceCents;
                    }
                }
            }

            if(transactions.length === 0 || balanceCents === 0){
                balance = "0,00"
            }
            
            const historic = {
                transactions,
                balance,
                balanceStatus
            };
            

            res.send(historic);
        } else {
            res.sendStatus(401);
        }
        
    } catch (e){
        res.sendStatus(500);
    }
});

app.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        const errors = signinSchema.validate(req.body).error;

        if(errors) return res.sendStatus(400);

        const result = await connection.query(
            `SELECT * 
            FROM users 
            WHERE email = $1`,
            [email]
        );
        
        if(result.rows.length === 0) return res.sendStatus(400);

        const user = result.rows[0];

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

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.get("/", (req, res) => {
    const randNumber = getRandomIntInclusive(0,10);
    console.log(randNumber);
    if(randNumber>= 5){
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

export default app;
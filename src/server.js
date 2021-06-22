import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';


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

/* app.post("/sign-in", async (req, res) => {
    const { email, senha } = req.body;
    console.log(email, senha);
    // Busque o usuário no banco e valide a senha usando bcrypt

    const result = await connection.query(`SELECT * FROM users WHERE email = $1`, [email]);
    
    const user  = result.rows;

    console.log(user[2]);

    if(user && bcrypt.compareSync(senha, user[2].senha)){
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
}); */
app.post("/login")


app.post("/signup", async (req, res)=> {
    try {
        const { name, email, password } = req.body;
        console.log(name, email, password);

        const hash = bcrypt.hashSync(password, 12);

        console.log(hash);

        await connection.query(`
            INSERT INTO users 
            (name, email, hash)
            VALUES ($1, $2, $3)`,
            [name, email,hash]
        );

        res.sendStatus(201);
        
    } catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});

app.get("/signup", async (req, res) => {
    try {
        const users = await connection.query(
            `SELECT * FROM users`
            );
        
        res.send(users.rows);
    } catch(e){
        console.log(e);
        res.send(500);
    }
});

app.get("/", (req, res) => { 
    res.send("oi");
});

app.listen(4000, () => {
    console.log("Running on port 4000...");
});

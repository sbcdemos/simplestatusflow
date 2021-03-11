const express = require('express')
const app = express()
const port = 8070
app.use(express.json())

const { Pool, Client } = require('pg')
const pool = new Pool({
    user: 'root',
    host: '192.168.0.77',
    database: 'work',
    password: '3Edcrfvtgb120-',
    port: 5432
})

app.get('/', async (req, res) => {
    const qres = await pool.query('SELECT NOW()')
    res.send(qres);
})

app.post('/data', async (req, res) =>{
    const newDataSQL="INSERT INTO UserData (UserName, Description, Status) VALUES ($1, $2, $3) RETURNING *";
    const newDataLine = [req.body.username, req.body.description, 0];
    const qr = await pool.query(newDataSQL, newDataLine);
    res.send(qr.rows[0]);
})


app.listen(port, () => {
    console.log(`Workflow example app listening at http://localhost:${port}`)
})
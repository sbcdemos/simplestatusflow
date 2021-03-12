const express = require('express')
const app = express()
const port = 8070
app.use(express.json())

const { Pool, Client } = require('pg')
const pool = new Pool()

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
app.get('/data/moderate', async (req, res)=>{
    const updateAndGetID_SQL='UPDATE Userdata \
    SET Status = 1, \
        TheDate=CURRENT_TIMESTAMP \
    WHERE id = ( \
            SELECT Id\
            FROM userdata\
            WHERE Status = 0 or (status=1 and TheDate<CURRENT_TIMESTAMP- INTERVAL \'20 minute\')\
            ORDER BY thedate \
            LIMIT 1 \
        ) and Status=0 \
    RETURNING ID';
    var response={};
    while (true){
        const qr= await pool.query(updateAndGetID_SQL);
        if (qr.rows.length==1){
            response = qr.rows[0];
            break
        }
    }
    res.send(response);
})
app.put('/data/moderate', async (req, res)=>{
    const setModerated_SQL =' UPDATE UserData SET Status=2 WHERE ID=$1';
    const qr = await pool.query(setModerated_SQL, [req.body.recordid]);
    res.send('OK');
})


app.listen(port, () => {
    console.log(`Workflow example app listening at http://localhost:${port}`)
})
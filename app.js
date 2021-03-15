const express = require('express')
const app = express()
const port = 8070
app.use(express.json())

/*const { Pool, Client } = require('pg')
const pool = new Pool()
*/
const mysql = require('mysql2');
const pool = mysql.createPool({host: process.env.PGHOST, user: 'root', database: process.env.PGDATABASE, password: process.env.PGPASSWORD});
const promisePool = pool.promise();

app.get('/', async (req, res) => {
    const [rows,fields] = await promisePool.query('SELECT NOW()')
    res.send(rows);
})

app.post('/data', async (req, res) =>{
    const newDataSQL="INSERT INTO UserData (UserName, Description, `Status`) VALUES (?, ?, ?); "
    const newDataLine = [req.body.username, req.body.description, 0];
    await promisePool.execute(newDataSQL, newDataLine);
    const rows = await promisePool.query("SELECT LAST_INSERT_ID() as id;")
    res.send(rows[0]);
})
app.get('/data/moderate', async (req, res)=>{
    var rand = Math.floor(Math.random() * 2) + 1;
    const updateAndGetID_SQL=' \
    UPDATE Userdata \
    SET Status = 1, \
        TheDate=CURRENT_TIMESTAMP \
        WHERE id = ( \
            SELECT Id FROM (SELECT ID\
                FROM userdata\
                WHERE Status = 0 \
                ORDER BY thedate \
                LIMIT 1 \
                OFFSET '+rand+' \
            ) as B\
        ) and Status=0 and last_insert_id(id); '
    var response={};
    var trycount=0;
    while (true){
        const [rows,fields] = await promisePool.execute(updateAndGetID_SQL);
        if (rows.affectedRows==1){
            const rows = await promisePool.query('SELECT last_insert_id() as id');
            response = rows[0][0];
            break
        }
        trycount++;
        console.log("retrying GetNext one more time: "+ trycount);
    }
    res.send(response);
})
app.put('/data/moderate', async (req, res)=>{
    const setModerated_SQL =' UPDATE UserData SET Status=2 WHERE ID=?';
    await promisePool.execute(setModerated_SQL, [req.body.recordid]);
    res.send('OK');
})


app.listen(port, () => {
    console.log(`Workflow example app listening at http://localhost:${port}`)
})
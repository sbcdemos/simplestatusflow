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
    const getRandomBoundariesSQL = '\
            SELECT min(id) as MinValue, max(id) as MaxValue \
            FROM userdata\
            WHERE Status = 0\
    ';
    // or (status=1 and TheDate<CURRENT_TIMESTAMP- INTERVAL \'20 minute\')\
    var response={};
    var trycount=0;
    while (true){
        var valueBoundaries=await pool.query(getRandomBoundariesSQL);
        var rand = valueBoundaries.rows[0].minvalue+Math.floor(Math.random() * (valueBoundaries.rows[0].maxvalue-valueBoundaries.rows[0].minvalue)) + 1;

        const updateAndGetID_SQL='UPDATE Userdata \
        SET Status = 1, \
            TheDate=CURRENT_TIMESTAMP \
        WHERE id = ( \
                SELECT max(Id)\
                FROM userdata\
                WHERE id<= '+rand+'\
            ) and Status=0 \
        RETURNING ID';
        const qr= await pool.query(updateAndGetID_SQL);
        if (qr.rows.length==1){
            response = qr.rows[0];
            break
        }
        trycount++;
        console.log("retrying GetNext one more time: "+ trycount+' last got id:'+rand);
        if (trycount>10){
            throw new Error('I cant get anything to moderate ');
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
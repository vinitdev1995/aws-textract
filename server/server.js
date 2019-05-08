const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require("dotenv").config()

require('./model/config');
const routes = require('./route/route');
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL);

const db = mongoose.connection;
db.on('error',console.error);

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

db.once('open',function(){

    app.use(express.static('public'));
    app.use('/',routes);

    const server = app.listen(8000,function(){
        const host =  server.address().address;
        const port = server.address().port;
        console.log("Example app listening at http://%s:%s", host, port);
    });
});






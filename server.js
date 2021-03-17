'use strict';

const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override');

const PORT = process.env.PORT || 4000;
const app = express();


require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// routes
app.get('/', homeHandler);
app.get('/getCountryResult', getCountryResultHandler);
app.get('/allCountries', allCountriesHandler);
app.post('/myRecords', myRecordsHandler);
app.get('/myRecords', myRecordsHandler2);
app.get('/recordDetails/:id', recordDetailsHandler);
app.delete('/deleteRecord/:id', deleteRecordHandler);

// Handlers 

function homeHandler(req, res) {
    let url = 'https://api.covid19api.com/world/total';

    superagent.get(url)
        .then((data) => {
            //    console.log(data.body);
            res.render('pages/home', { data: data.body });
        })
}

function getCountryResultHandler(req, res) {
    let { country, from, to } = req.query;
    let url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`

    superagent.get(url)
        .then((data) => {
            let countryData = data.body.map((item) => {

                return new oneCountry(item);
            })
            res.render('pages/getCountryResult', { data: countryData });
        })

}

function allCountriesHandler(req, res) {
    let url = 'https://api.covid19api.com/summary';
    superagent.get(url)
        .then((data) => {
            let countriesData = data.body.Countries.map((item) => {
                return new Countries(item);
            })
            res.render('pages/allCountries', { data: countriesData })
        })

}

function myRecordsHandler(req, res) {
    let { country, totalconfirmed, totaldeaths, totalrecovered, date } = req.body;
    let sql = `INSERT INTO country123 (country, totalconfirmed, totaldeaths ,totalrecovered ,date) VALUES ($1, $2 , $3 , $4 , $5) RETURNING *;`;
    let values = [country, totalconfirmed, totaldeaths, totalrecovered, date];

    client.query(sql, values)
        .then((results) => {
            res.redirect('/myRecords');
        })

}

function myRecordsHandler2(req, res) {
    let sql = `SELECT * FROM country123;`

    client.query(sql)
        .then((results) => {
            res.render('pages/myRecords', { data: results.rows })
        })

}

function recordDetailsHandler(req, res) {
    let id = req.params.id;
    let sql = 'SELECT * FROM country123 WHERE id=$1;';

    let value = [id];

    client.query(sql, value)
        .then((results) => {
            res.render(`pages/recordDetails`, { data: results.rows[0] });
        })
}

function deleteRecordHandler(req, res) {
    let id = req.params.id;
    let sql = `DELETE FROM country123 WHERE id=$1`;

    let value = [id];

    client.query(sql, value)
        .then((results) => {
            res.redirect('/myRecords');

        })
}


// Constructors

function oneCountry(data) {
    this.country = data.Country;
    this.cases = data.Cases;
    this.date = data.Date;
}


function Countries(data) {
    this.country = data.Country;
    this.totalconfirmed = data.TotalConfirmed;
    this.totaldeaths = data.TotalDeaths;
    this.totalrecovered = data.TotalRecovered;
    this.date = data.Date;
}



client.connect()
    .then(() => {
        app.listen(PORT, () => {

            console.log(`Listening on PORT ${PORT}`)
        })

    })
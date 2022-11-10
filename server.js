// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'power-plant-db.sqlite3');

let app = express();
let port = 8000;

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' (redirect to desired route)
/*app.get('/', (req, res) => {
    let home = ''; // <-- change this
    res.redirect(home);
});*/


// Example GET request handler for data about a specific year
app.get('/country/:cid', (req, res) => {
    let cid = req.params.cid.toUpperCase();
    console.log(req.params.selected_year);
    fs.readFile(path.join(template_dir, 'index.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT plants.name, countries.country, plants.capacity_mw, \
                    plants.generation_gwh_2015, fuels.fuel, plants.url \
                    FROM plants INNER JOIN countries ON \
                    plants.countryId = countries.countryid INNER JOIN fuels ON plants.fuelId = fuels.fuelId WHERE countries.countryid = ?';

        db.all(query, cid, (err, rows) => {
            // console.log(err);
            console.log(rows);
            let response = template.toString();
            // response = response.replace('%%MANUFACTURER%%', rows[0].mfr);
            // response = response.replace('%%MFR_ALT_TEXT%%', 'logo for ' + rows[0].mfr);
            // response = response.replace('%%MFR_IMAGE%%', '/images/' + mfr + '_logo.png');
            let plant_data = '';
            for (let i=0; i < rows.length; i++) {
                plant_data = plant_data + '<tr>';
                plant_data = plant_data + '<td>' + rows[i].country + '</td>';
                plant_data = plant_data + '<td>' + rows[i].name + '</td>';
                plant_data = plant_data + '<td>' + rows[i].capacity_mw + '</td>';
                plant_data = plant_data + '<td>' + rows[i].generation_gwh_2015 + '</td>';
                plant_data = plant_data + '<td>' + rows[i].fuel + '</td>';
                plant_data = plant_data + '<td>' + rows[i].url + '</td>';
                plant_data = plant_data + '</tr>';

            }
            response = response.replace('%%PLANT_INFO%%', plant_data);
                
            res.status(200).type('html').send(response);
        });
    });
});


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});

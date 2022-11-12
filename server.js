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
app.get('/', (req, res) => {
    let home = '/country/ALB'; // <-- change this
    res.redirect(home);
   
})


// Example GET request handler for data about a specific year
app.get('/country/:cid', (req, res) => {
    let cid = req.params.cid.toUpperCase();
    fs.readFile(path.join(template_dir, 'index.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT plants.name, countries.country, plants.capacity_mw, plants.fuelId, plants.generation_gwh_2013,\
                    plants.generation_gwh_2014, plants.generation_gwh_2015, plants.generation_gwh_2016, plants.generation_gwh_2017, \
                    plants.generation_gwh_2018, plants.generation_gwh_2019, fuels.fuel, plants.url \
                    FROM plants INNER JOIN countries ON \
                    plants.countryId = countries.countryid INNER JOIN fuels ON plants.fuelId = fuels.fuelId WHERE countries.countryid = ?';
        let response = template.toString();
        let fillQuery = 'SELECT countryid FROM countries';
        let fillData = '';

        db.all(query, cid, (err, rows) => {
            let plant_data = '';
            let total_capacity = [];
            for (let i=0; i < 15; i++) {
                total_capacity[i] = 0;
            }
            for (let i=0; i < rows.length; i++) {
                plant_data = plant_data + '<tr>';
                plant_data = plant_data + '<td>' + rows[i].name + '</td>';
                plant_data = plant_data + '<td>' + rows[i].country + '</td>';
                plant_data = plant_data + '<td>' + rows[i].capacity_mw + '</td>';
                //NA inserted if generation is empty
                if (rows[i].generation_gwh_2013 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2013.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2014 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2014.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2015 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2015.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2016 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2016.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2017 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2017.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2018 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2018.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2019 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2019.toFixed(2) + '</td>';
                }
                plant_data = plant_data + '<td>' + rows[i].fuel + '</td>';
                plant_data = plant_data + '<td><a href="' + rows[i].url + '" target="_blank">link</a></td>';
                plant_data = plant_data + '</tr>';

                total_capacity[rows[i].fuelId] = total_capacity[rows[i].fuelId] + rows[i].capacity_mw;
                
            }
            let total_capacity_data = 
            "['Hydro', " + total_capacity[0] + "]," +
            "['Solar', " + total_capacity[1] + "]," +
            "['Gas', " + total_capacity[2] + "]," +
            "['Oil', " + total_capacity[3] + "]," +
            "['Nuclear', " + total_capacity[4] + "]," +
            "['Wind', " + total_capacity[5] + "]," +
            "['Coal', " + total_capacity[6] + "]," +
            "['Waste', " + total_capacity[7] + "]," +
            "['Biomass', " + total_capacity[8] + "]," +
            "['Wave and Tidal', " + total_capacity[9] + "]," +
            "['Petcoke', " + total_capacity[10] + "]," +
            "['Geothermal', " + total_capacity[11] + "]," +
            "['Storage', " + total_capacity[12] + "]," +
            "['Cogeneration', " + total_capacity[13] + "]," +
            "['Other', " + total_capacity[14] + "]";
            response = response.replace('%%TOTAL_CAPACITY%%', total_capacity_data);
            response = response.replace('%%HEIGHT%%', 500);
            response = response.replace('%%PLANT_INFO%%', plant_data);
            response = response.replace('%%SYMBOL_ALT%%', 'filler image');
            response = response.replace('%%SYMBOL%%', '/images/blank.png');
            //Fills country options in dropdown
            if(rows.length<=0){
                res.status(404).send('404 error sent - Query not found');
            }else{
                db.all(fillQuery, (err, rows) => {
                    for (let i=0; i < rows.length-1; i++) {
                        fillData = fillData + '<a href="/country/'+rows[i].countryid+'">'+rows[i].countryid+'</a>';
                    }
                    response = response.replace('%%COUNTRY_OPTIONS%%', fillData);
                    // This makes the buttons appear.
                    response = response.replaceAll('hidden', '');
                    res.status(200).type('html').send(response);
                    
                });
            }
            
            


        });

        
        
        
    });
});


app.get('/fuel/:fid', (req, res) => {
    let fid = req.params.fid;
    fs.readFile(path.join(template_dir, 'index.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = 'SELECT plants.name, countries.country, plants.capacity_mw, plants.generation_gwh_2013,\
                    plants.generation_gwh_2014, plants.generation_gwh_2015, plants.generation_gwh_2016, plants.generation_gwh_2017, \
                    plants.generation_gwh_2018, plants.generation_gwh_2019, fuels.fuel, plants.url, plants.fuelId \
                    FROM plants INNER JOIN countries ON \
                    plants.countryId = countries.countryid INNER JOIN fuels ON plants.fuelId = fuels.fuelId WHERE fuels.fuel = ?';
        let response = template.toString();
        let fillQuery = 'SELECT countryid FROM countries';
        let fillData = '';

        db.all(query, fid, (err, rows) => {
            let plant_data = '';
            let total_capacity = 0;
            for (let i=0; i < rows.length; i++) {

                // // fuel test for building the list of fuel types for button
                // if(!fuelTestArr.includes(rows[i].fuel)){
                //     fuelTestArr.push(rows[i].fuel);
                //     fuelTestStr = fuelTestStr + rows[i].fuel;
                // }

                plant_data = plant_data + '<tr>';
                plant_data = plant_data + '<td>' + rows[i].name + '</td>';
                plant_data = plant_data + '<td>' + rows[i].country + '</td>';
                plant_data = plant_data + '<td>' + rows[i].capacity_mw + '</td>';
                //NA inserted if generation is empty
                if (rows[i].generation_gwh_2013 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2013.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2014 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2014.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2015 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2015.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2016 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2016.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2017 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2017.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2018 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2018.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2019 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2019.toFixed(2) + '</td>';
                }

                plant_data = plant_data + '<td>' + rows[i].fuel + '</td>';
                plant_data = plant_data + '<td><a href="' + rows[i].url + '" target="_blank">link</a></td>';
                plant_data = plant_data + '</tr>';

                total_capacity = total_capacity + rows[i].capacity_mw;

            }
            let total_capacity_data = "['" + rows[0].fuel + "', " + total_capacity + "]";
            response = response.replace('%%TOTAL_CAPACITY%%', total_capacity_data); 
            response = response.replace('%%HEIGHT%%', 200);
            response = response.replace('%%PLANT_INFO%%', plant_data);
            
            response = response.replace('%%SYMBOL_ALT%%', 'symbol for ' + rows[0].fuel);
            response = response.replace('%%SYMBOL%%', '/images/' + rows[0].fuelId + '_energy.png');
            console.log(rows[0].fuelId);
            //Fills country options in dropdown
            if(rows.length<=0){
                res.status(404).send('404 error sent - Query not found');
            }else{
                db.all(fillQuery, (err, rows) => {
                    for (let i=0; i < rows.length-1; i++) {
                        fillData = fillData + '<a href="/country/'+rows[i].countryid+'">'+rows[i].countryid+'</a>';
                    }
                    response = response.replace('%%COUNTRY_OPTIONS%%', fillData);
                    // This makes the buttons appear
                    response = response.replaceAll('hidden', '');
                    res.status(200).type('html').send(response);
                    
                });
            }
                
            
        });
    });
});


app.get('/capacity/:cap', (req, res) => {
    let cap = req.params.cap;
    fs.readFile(path.join(template_dir, 'index.html'), (err, template) => {
        let query = 'SELECT plants.name, countries.country, plants.capacity_mw, plants.fuelId, plants.generation_gwh_2013,\
                    plants.generation_gwh_2014, plants.generation_gwh_2015, plants.generation_gwh_2016, plants.generation_gwh_2017, \
                    plants.generation_gwh_2018, plants.generation_gwh_2019, fuels.fuel, plants.url \
                    FROM plants INNER JOIN countries ON \
                    plants.countryId = countries.countryid INNER JOIN fuels ON plants.fuelId = fuels.fuelId WHERE plants.capacity_mw >= ?';
        let response = template.toString();
        let fillQuery = 'SELECT countryid FROM countries';
        let fillData = '';
        let total_capacity = [];
        db.all(query, cap, (err, rows) => {
            let plant_data = '';
            for (let i=0; i < 15; i++) {
                total_capacity[i] = 0;
            }
            for (let i=0; i < rows.length; i++) {
                plant_data = plant_data + '<tr>';
                plant_data = plant_data + '<td>' + rows[i].name + '</td>';
                plant_data = plant_data + '<td>' + rows[i].country + '</td>';
                plant_data = plant_data + '<td>' + rows[i].capacity_mw + '</td>';
                //NA inserted if generation is empty
                if (rows[i].generation_gwh_2013 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2013.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2014 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2014.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2015 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2015.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2016 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2016.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2017 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2017.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2018 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2018.toFixed(2) + '</td>';
                }
                if (rows[i].generation_gwh_2019 == '') {
                    plant_data = plant_data + '<td>NA</td>';
                } else {
                    plant_data = plant_data + '<td>' + rows[i].generation_gwh_2019.toFixed(2) + '</td>';
                }
                plant_data = plant_data + '<td>' + rows[i].fuel + '</td>';
                plant_data = plant_data + '<td><a href="' + rows[i].url + '" target="_blank">link</a></td>';
                plant_data = plant_data + '</tr>';

                total_capacity[rows[i].fuelId] = total_capacity[rows[i].fuelId] + rows[i].capacity_mw;

            }
            let total_capacity_data = 
            "['Hydro', " + total_capacity[0] + "]," +
            "['Solar', " + total_capacity[1] + "]," +
            "['Gas', " + total_capacity[2] + "]," +
            "['Oil', " + total_capacity[3] + "]," +
            "['Nuclear', " + total_capacity[4] + "]," +
            "['Wind', " + total_capacity[5] + "]," +
            "['Coal', " + total_capacity[6] + "]," +
            "['Waste', " + total_capacity[7] + "]," +
            "['Biomass', " + total_capacity[8] + "]," +
            "['Wave and Tidal', " + total_capacity[9] + "]," +
            "['Petcoke', " + total_capacity[10] + "]," +
            "['Geothermal', " + total_capacity[11] + "]," +
            "['Storage', " + total_capacity[12] + "]," +
            "['Cogeneration', " + total_capacity[13] + "]," +
            "['Other', " + total_capacity[14] + "]";
            response = response.replace('%%TOTAL_CAPACITY%%', total_capacity_data);
            response = response.replace('%%HEIGHT%%', 500);
            response = response.replace('%%PLANT_INFO%%', plant_data);
            response = response.replace('%%SYMBOL_ALT%%', 'filler image');
            response = response.replace('%%SYMBOL%%', '/images/blank.png');
            //Fills country options in dropdown
            if(rows.length<=0){
                res.status(404).send('404 error sent - Query not found');
            }else{
                db.all(fillQuery, (err, rows) => {
                    for (let i=0; i < rows.length-1; i++) {
                        fillData = fillData + '<a href="/country/'+rows[i].countryid+'">'+rows[i].countryid+'</a>';
                    }
                    response = response.replace('%%COUNTRY_OPTIONS%%', fillData);
                    res.status(200).type('html').send(response);
                    
                });
            }   
                
            
        });
    });
});


// // 404 error handling for anything that is not localhost:####/country/, localhost:####/fuel/, 
// or localhost:####/capacity/
app.get('/*$', (req, res) => {
    fs.readFile(path.join(template_dir, 'index.html'), (err, template) => {
        let fillQuery = 'SELECT countryid FROM countries';
        let fillData = '';
        let response = template.toString();
        response = response.replace('%%PLANT_INFO%%', '404 error sent, bad request');
        db.all(fillQuery, (err, rows) => {
            for (let i=0; i < rows.length-1; i++) {
                fillData = fillData + '<a href="/country/'+rows[i].countryid+'">'+rows[i].countryid+'</a>';
            }
            response = response.replace('%%COUNTRY_OPTIONS%%', fillData);
            res.status(404).send(response);
        });
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});

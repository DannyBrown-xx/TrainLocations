'use strict';

const express = require('express');
const exphbs = require('express-handlebars');
const http = require('http');
const socketIO = require('socket.io');
const helpers = require('./views/handlebars-helpers.js');

const app = express();
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: helpers
}));
app.set('view engine', 'handlebars');

const server = http.Server(app);
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Listening on port ${port}`)
});

const io = socketIO(server);

class TrainLocator {
  constructor() {
    this.headCodes = [];
    this.trainLocations = [];
  }

  add(headCode, locale) {
    if(this.headCodes.indexOf(headCode) === -1) {
      this.headCodes.push(headCode);
      this.trainLocations[this.headCodes.length - 1] = [];
    }
    for(let i = 0; i < this.headCodes.length; i++) {
      if(this.headCodes[i] === headCode) {
        this.trainLocations[i].push(locale);
      }
    }
  }

  getGoogleFormatted() {
    let data = [];
    console.log(this.headCodes.length + " trains");
    for(let i = 0; i < this.headCodes.length; i++) {
      console.log("Google formatting for headcode " + this.headCodes[i]);
      console.log("%j", this.trainLocations[i]);
      data.push(this.trainLocations[i]);
    }
    console.log("Total: %j", data);
    return data;
  }
}
const trainCounter = new TrainLocator();

io.on('connection', socket => {
  console.log('Train connected');

  socket.on('disconnect', () => {
    console.log('Train disconnected');
  });

  socket.on('location-update', message => {
    trainCounter.add(message.headCode, {lat:message.location.latitude, lng:message.location.longitude});
    console.log(`Train (head code ${message.headCode}) is at location: (${message.location.latitude}, ${message.location.longitude})`);
  });
});

app.get('/', (req, res) => {
  res.render('map', {
                      title: 'Map of Train Locations',
                      trainLocations: trainCounter.getGoogleFormatted()
                    });
});

app.get('/report', (req, res) => {
  res.render('reporter', {title: 'Reporting Location'});
});

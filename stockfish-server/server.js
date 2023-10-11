#!/usr/bin/env node

const express = require('express');
const app = express();
const cors = require('cors');

const port = 8080;
const stockfish = require('stockfish');
const engine = stockfish();
const fenregex =
  '/^([rnbqkpRNBQKP1-8]+/){7}([rnbqkpRNBQKP1-8]+)s[bw]s(-|K?Q?k?q?)s(-|[a-h][36])s(0|[1-9][0-9]*)s([1-9][0-9]*)/';

engine.onmessage = function (msg) {
  console.log(msg);
};

engine.postMessage('uci');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.post('/', (request, response) => {
  console.log(request.body.fen);

  engine.onmessage = function (msg) {
    if (response.headersSent) {
      return;
    }
    if (typeof (msg == 'string') && msg.match('bestmove')) {
      response.send(msg);
      engine.postMessage('quit');
    }
  };

  // run chess engine
  engine.postMessage('ucinewgame');
  engine.postMessage('position fen ' + request.body.fen);
  engine.postMessage('go depth 18');
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err);
  }

  console.log(`server is listening on ${port}`);
});

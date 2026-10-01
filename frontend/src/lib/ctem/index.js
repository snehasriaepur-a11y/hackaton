const { patients } = require('./patients');
const { trials } = require('./trials');
const matchingEngine = require('./matchingEngine');
const nlp = require('./nlp');
const evaluation = require('./evaluation');

const search = require('./search');
const assistant = require('./assistant');
module.exports = Object.assign({}, matchingEngine, nlp, evaluation, search, assistant, {
  patients,
  trials
});

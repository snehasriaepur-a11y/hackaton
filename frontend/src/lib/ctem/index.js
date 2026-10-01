const { patients } = require('./patients');
const { trials } = require('./trials');
const matchingEngine = require('./matchingEngine');
const nlp = require('./nlp');
const evaluation = require('./evaluation');

module.exports = Object.assign({}, matchingEngine, nlp, evaluation, {
  patients,
  trials
});

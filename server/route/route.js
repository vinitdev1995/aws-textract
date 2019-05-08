var routes = require('express').Router();
var exports = require('../controller/export');

routes.post('/getAwsTextract',exports.getAwsTextract);

module.exports = routes;

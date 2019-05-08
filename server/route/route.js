var routes = require('express').Router();
var exports = require('../controller/export');

routes.post('/getAwsTextract',exports.getAwsTextract);
routes.post('/get-signed-url',exports.getSignedURL);

module.exports = routes;

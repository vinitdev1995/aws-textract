const mongoose = require('mongoose');

const sample = new mongoose.Schema({
	name : String,
	alterEgo : String,
	power :String
},{
	collection:'sample'
});

mongoose.model('sample', sample)

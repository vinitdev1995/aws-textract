require("dotenv").config()
const AWS = require('aws-sdk')

const textract = new AWS.Textract({
    bucket: process.env.S3BUCKET,
    accessKeyId: process.env.S3ACCESSKEYID,
    secretAccessKey: process.env.S3SECRETKEY,
    region : "us-east-1",
	apiVersion: "2018-06-27"
});

/**
 * Textract Payload
 * {
   "Document":{
      "S3Object":{
        region : "us-east-1",
        bucket: process.env.S3BUCKET,
        accessKeyId: process.env.S3ACCESSKEYID,
        secretAccessKey: process.env.S3SECRETKEY,
        Bucket: process.env.S3BUCKET,
        Name: "sample.png"
      }
   },
   "FeatureTypes":[
      "TABLES",
      "FORMS"
   ]
}
 */

module.exports.getAwsTextract = function(req,res){
    try{
    	const params = {
            "Document":{
                "S3Object":{
                    Bucket: process.env.S3BUCKET,
                    Name:"TableCapture.PNG"
                }
            },
            "FeatureTypes":[
                "TABLES",
                "FORMS"
            ]
        }
        textract.analyzeDocument(params, function (err, data) {
            if (err){
                console.log(err, err.stack); // an error occurred
                res.status(400).json({done: false, err, message: "No results, We can’t find any text. Please try another document."})
            } else{
                res.send({done: true, data}); // successful response
            }
        });
    }catch(e){
        res.send(response);
    }
}
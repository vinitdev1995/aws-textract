require("dotenv").config()
const AWS = require('aws-sdk')

const textract = new AWS.Textract({
    bucket: process.env.S3BUCKET,
    accessKeyId: process.env.S3ACCESSKEYID,
    secretAccessKey: process.env.S3SECRETKEY,
    region : "us-east-1",
	apiVersion: "2018-06-27"
});

const s3 = new AWS.S3({
    region : "us-east-1",
    bucket: process.env.S3BUCKET,
    accessKeyId: process.env.S3ACCESSKEYID,
    secretAccessKey: process.env.S3SECRETKEY,
})

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
      OR
      {
        "Document": {
            "Bytes": "/9j/4AAQSk....."
        }
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
        const params = req.body
    	/* const params = {
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
        } */
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

module.exports.getSignedURL = function(req, res){
    let { opType, bucketName, fileName, options } = req.body
    // console.log("tags : ", options.tags )
    if(!bucketName || !fileName) {
        return res.status(422).send({ error: "No bucketName or fileName provided" })
    }

    const allowedOps = ["download", "upload"]
    if(!allowedOps.includes(opType)) {
        return res.status(422).send({ error: "invalid opType" })
    }
    const opTypes = { download: "getObject", upload: "putObject" }
    const params = {Bucket: bucketName, Key: fileName, Expires: 90}
    if(opType === "upload") {
        params.ContentType = options.contentType
        // params.Tagging = options.tags ? querystring.stringify(options.tags) : ""
        console.log("tags : ", params.Tagging )
    } else if(opType === "download" && options && options.versionId ) {
        params.VersionId = options.versionId
    }
    let url
    try {
        url = s3.getSignedUrl(opTypes[opType], params)
    } catch (err) {
        console.log("err in getting s3 url : ", err)
        return res.status(422).send({ error: "err in getting s3 url" })
    }
    return res.send({ url })
}
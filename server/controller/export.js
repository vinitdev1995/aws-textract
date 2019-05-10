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

const blockExtract = (tableData) => {
    let blocksKeyObj = {}
    let formFields = []
    tableData.Blocks.forEach(data => {
        blocksKeyObj = {
            ...blocksKeyObj,
            [data.Id]: data
        }
    })
    const tables = tableData.Blocks.filter(b => b.BlockType === "TABLE")
    const lines = tableData.Blocks.filter(b => b.BlockType === "LINE")
    const words = tableData.Blocks.filter(b => b.BlockType === "WORD")
    const forms = tableData.Blocks.filter(b => b.BlockType === "KEY_VALUE_SET" && b.EntityTypes && b.EntityTypes.toString() === "KEY" )
    tables.forEach(table => {
        table.cells = []
        table.Relationships.forEach(cells => {
            if(cells && cells.Ids && cells.Ids.length){
                table.cells = cells.Ids.map(id => blocksKeyObj[id])
            }
        })

        table.cells.forEach(cell => {
            if(cell && cell.Relationships){
                cell.Relationships.forEach(words => {
                    cell.words = words.Ids.map(id => blocksKeyObj[id].Text)
                    cell.cellText = value = (cell.words && Array.isArray(cell.words) && cell.words.join(" ")) || ""
                })
            }
        })

        table.cols = table.cells.reduce((prev, current) => (prev.ColumnIndex > current.ColumnIndex) ? prev.ColumnIndex : current.ColumnIndex)
        table.rows = table.cells.reduce((prev, current) => (prev.RowIndex > current.RowIndex) ? prev.RowIndex : current.RowIndex)
    })

    forms.forEach(form => {
        if(form && form.Relationships){
            let value = form.Relationships.find(rel => rel.Type === "VALUE")
            let key = form.Relationships.find(rel => rel.Type === "CHILD")
            if(key){
                key = key.Ids.map(id => blocksKeyObj[id].Text)
                key = key.join(" ")
            }
            if(value){
                value.Ids.forEach(id => {
                    if(blocksKeyObj[id] && blocksKeyObj[id].Relationships){
                        blocksKeyObj[id].Relationships.forEach(rel => {
                            console.log("value",  rel)
                            value = rel.Ids.map(id => blocksKeyObj[id].Text)
                        })
                    }
                })
                value = (value && Array.isArray(value) && value.join(" ")) || ""
            }
            formFields.push({Id: form.Id, key, value})
        }
    })
    console.log(tables)
    return {
        tables,
        lines,
        words,
        formFields
    }
}

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
                const blocks = blockExtract(data)
                res.send({done: true, blocks}); // successful response
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
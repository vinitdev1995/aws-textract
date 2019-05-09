import React, {Component} from "react"
import ReactTable from 'react-table'
import "react-table/react-table.css"
import {Card, Pagination, PaginationItem, PaginationLink} from 'reactstrap';
import axios from 'axios';

const S3BUCKET= "munivisor-docs-dev"

export default class Table extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tableData: {},
            file: {},
            selectedFile: {},
        }
    }

    getBase64 = (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onerror = () => { reader.abort(); reject(new Error("Error parsing file"));}
            reader.readAsDataURL(file);
            reader.onload = function () {

                //This will result in an array that will be recognized by C#.NET WebApi as a byte[]
                // let bytes = Array.from(new Uint8Array(this.result));

                //if you want the base64encoded file you would use the below line:
                // let base64StringFile = btoa(bytes.map((item) => String.fromCharCode(item)).join(""));
                console.log("base64String ==>", reader.result)
                //Resolve the promise with your custom file structure
                resolve({
                    // bytes: bytes,
                    base64StringFile: reader.result,
                    fileName: file.name,
                    fileType: file.type,
                    originalFile: file
                });
            }
            // reader.readAsArrayBuffer(file);
        });
    }

    getSignedUrl = async (payload) => {
        try {
            const res = await axios.post(`http://localhost:8000/get-signed-url`, payload)
            if(res && res.status === 200){
                return res
            }
            return null
        } catch (err) {
            console.log("err in getSignedUrl ", err.message)
            return null
        }
    }

    uploadWithSignedUrl = async (file, fileName) => {
        const opType = "upload"
        const contentType = file.type
        const tags = {
            status : "Success"
        }
        const options = { contentType, tags }

        const res = await this.getSignedUrl({  // eslint-disable-line
            opType,
            bucketName: S3BUCKET,
            fileName: `TEXTRACT/${fileName}`,
            options
        })

        const xhr = new XMLHttpRequest()
        xhr.open("PUT", res.data.url, true)
        xhr.setRequestHeader("Content-Type", file.type)
        if (tags) {
            console.log("No tagging required any more")
            // xhr.setRequestHeader("x-amz-tagging", qs.stringify(tags))
        }
        xhr.onload = async () => {
            // console.log("readyState : ", xhr.readyState)
            if (xhr.status === 200) {
                this.onUpload(file, fileName)
            }
        }
        xhr.onerror = err => {
            console.log("error in file uploaded", xhr.status, xhr.responseText, err)
        }
        xhr.send(file)
    }

    onUpload = async (file, fileName) => {
        const base64Obj = await this.getBase64(file)
        /*
        const file = event.target.files[0]
        const base64Obj = await this.getBase64(file)
        let fileName = file.name
        const extnIdx = fileName.lastIndexOf(".")
        if (extnIdx > -1) {
            fileName = `${fileName.substr(
                0,
                extnIdx
            )}_${new Date().getTime()}${fileName.substr(extnIdx)}`
        }
        */
        const params = {
            "Document":{
                "S3Object":{
                    // "Bytes": (base64Obj && base64Obj.base64StringFile) || ""
                    Bucket: S3BUCKET,
                    Name: `TEXTRACT/${fileName}`
                }
            },
            "FeatureTypes":[
                "TABLES",
                "FORMS"
            ]
        }
        // console.log(base64Obj)
        axios.post('http://localhost:8000/getAwsTextract', params)
            .then(response => {
                this.setState({
                    tableData: (response && response.data && response.data.data) || {},
                    file: base64Obj,
                })
            })
            .catch(error => {
                console.log(error);
            })
    }

    onFileSelect = (event) => {
        const file = event.target.files[0]
        // const base64Obj = await this.getBase64(file)
        // const buff = Buffer.from(base64Obj.base64StringFile, 'base64')
        // const uintArray = new Uint8Array(buff)
        // const buffer = await this.s2ab(file)
        if(file){
            let fileName = file.name
            const extnIdx = fileName.lastIndexOf(".")
            if (extnIdx > -1) {
                fileName = `${fileName.substr(
                    0,
                    extnIdx
                )}_${new Date().getTime()}${fileName.substr(extnIdx)}`
            }
            this.uploadWithSignedUrl(file,  fileName)
        }
    }

    onSelect = (event) => {
        this.setState({
            selectedFile: (event.target.files && event.target.files[0]) || {}
        })
    }

    onFileUpload = () => {
        const {selectedFile} = this.state
        if(selectedFile){
            let fileName = selectedFile.name
            const extnIdx = fileName.lastIndexOf(".")
            if (extnIdx > -1) {
                fileName = `${fileName.substr(
                    0,
                    extnIdx
                )}_${new Date().getTime()}${fileName.substr(extnIdx)}`
            }
            this.uploadWithSignedUrl(selectedFile,  fileName)
        }
    }

    render() {
        console.log("tableData", this.state.tableData)
        const {file, selectedFile} = this.state
        const data = [{
            name: 'Tanner Linsley',
            age: 1,

        }, {
            name: 'Tanner Linsley',
            age: 2,
        }, {
            name: 'Tanner Linsley',
            age: 3,

        }, {
            name: 'Tanner Linsley',
            age: 4,

        }]

        const columns = [{
            id: 'Name',
            Header: 'Name',
            accessor: 'name',
        },
            {
                id: "Age",
                Header: "Age",
                accessor: item => item,
                Cell: row => {
                    const doc = row.value
                    return (
                        <div className="complain-details">
                            {doc.age}
                        </div>
                    )
                }
            }]


        return (
            <div className="flud-container" style={{overflow: "hidden"}}>
                <div className="row p-5">
                    <div className="col-sm-6">
                        <Card body>
                            <div className="input-group mb-3">
                                <div className="custom-file">
                                    <input type="file" className="custom-file-input" id="inputGroupFile02" onChange={this.onSelect} />
                                    <label className="custom-file-label" htmlFor="inputGroupFile02" aria-describedby="inputGroupFileAddon02">{selectedFile.name}</label>
                                </div>
                                <div className="input-group-append">
                                    <button className="btn btn-outline-secondary" type="button" onClick={this.onFileUpload} >Upload</button>
                                </div>
                            </div>
                            {  file && file.base64StringFile ?
                                <div>
                                    <img className="img-fluid img-thumbnail" style={{height: "auto",width: "auto"}} src={(file && file.base64StringFile) || ""} alt="Card image cap"/>
                                </div>
                                : null
                            }
                            {/* <Input type="file" onChange={this.onFileSelect} name="file"/> */}
                        </Card>
                    </div>
                    <div className="col-sm-6">
                        <Pagination size="sm" aria-label="Page navigation example">
                            <PaginationItem>
                                <PaginationLink first href="#"/>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink previous href="#"/>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="#">
                                    1
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="#">
                                    2
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink href="#">
                                    3
                                </PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink next href="#"/>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationLink last href="#"/>
                            </PaginationItem>
                        </Pagination>
                        <ReactTable
                            data={data}
                            columns={columns}
                            minRows={2}
                            className="-striped -highlight is-bordered"
                        />
                    </div>
                </div>
            </div>
        )
    }
}
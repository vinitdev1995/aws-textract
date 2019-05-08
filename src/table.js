import React, {Component} from "react"
import ReactTable from 'react-table'
import "react-table/react-table.css"
import logo from './logo.svg';
import {Card, CardImg, Input, Pagination, PaginationItem, PaginationLink} from 'reactstrap';
import axios from 'axios';

const S3BUCKET= "munivisor-docs-dev"

export default class Table extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tableData: {},
            file: {},
        }
    }

    getBase64 = (file) => {
        const reader = new FileReader();
        debugger
        return new Promise((resolve, reject) => {
            reader.onerror = () => { reader.abort(); reject(new Error("Error parsing file"));}
            reader.onload = function () {

                //This will result in an array that will be recognized by C#.NET WebApi as a byte[]
                let bytes = Array.from(new Uint8Array(this.result));

                //if you want the base64encoded file you would use the below line:
                let base64StringFile = btoa(bytes.map((item) => String.fromCharCode(item)).join(""));

                //Resolve the promise with your custom file structure
                resolve({
                    bytes: bytes,
                    base64StringFile: base64StringFile,
                    fileName: file.name,
                    fileType: file.type,
                    originalFile: file
                });
            }
            reader.readAsArrayBuffer(file);
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
            fileName: fileName,
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
                    Bucket: S3BUCKET,
                    Name: fileName
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

    render() {
        console.log("tableData", this.state.tableData)
        const {file} = this.state
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
            <div>
                <div className="container">
                    <div className="row">
                        <div className="col-sm-1"/>

                        <div className="col-sm-10">
                            <Card body>
                                {  file && file.base64StringFile ?
                                    <CardImg top width="50%" height="50%%" src={(file && file.base64StringFile && `data:image/png;base64,${file.base64StringFile}`) || ""} alt="Card image cap"/>
                                    : null
                                }
                                <Input type="file" onChange={this.onFileSelect} name="file"/>
                            </Card>
                            <div>&nbsp;
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
                            </div>
                            <ReactTable
                                data={data}
                                columns={columns}
                                minRows={2}
                                className="-striped -highlight is-bordered"
                            /></div>
                        <div className="col-sm-1"/>
                    </div>
                </div>
            </div>
        )
    }
}
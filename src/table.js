import React, {Component} from "react"
import ReactTable from 'react-table'
import "react-table/react-table.css"
import {Card, Pagination, PaginationItem, PaginationLink, Spinner} from 'reactstrap';
import axios from 'axios';

const S3BUCKET= "munivisor-docs-dev"

export default class Table extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tableData: {},
            file: {},
            selectedFile: null,
            isLoading: false
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
                const res = (response && response.data && response.data.data) || {}
                this.setState({
                    tableData: res,
                    file: base64Obj,
                    isLoading: false
                },()=> this.blockExtract())
            }).catch(error => {
                console.log(error);
            })
    }

    onFileSelect = (event) => {
        if(event.target.files.length){
            const file = event.target.files[0]
            if((file && file.type) === "image/png" || (file && file.type) === "image/jpeg" && (file && file.size) < 5000000){
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
                this.setState({
                    errorValidFile: "",
                    isLoading: true,
                })
            }else {
                this.setState({
                    errorValidFile: "Your document must be a .jpeg or .png. It must be no larger than 5MB.",
                })
            }
        }
    }

    onSelect = (event) => {
        if(event.target.files.length){
            const file = event.target.files[0]
            if((file && file.type) === "image/png" || (file && file.type) === "image/jpeg" && (file && file.size) < 5000000){
                this.setState({
                    errorValidFile: "",
                    selectedFile: (event.target.files && event.target.files[0]) || null
                })
            }else {
                this.setState({
                    errorValidFile: "Your document must be a .jpeg or .png. It must be no larger than 5MB.",
                })
            }
        }
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
            this.setState({
                isLoading: true
            })
        }
    }

    blockExtract = () => {
        const {tableData} = this.state
        let blocksKeyObj = {}
        tableData.Blocks.forEach(data => {
            blocksKeyObj = {
                ...blocksKeyObj,
                [data.Id]: data
            }
        })
        const tables = tableData.Blocks.filter(b => b.BlockType === "TABLE")
        const lines = tableData.Blocks.filter(b => b.BlockType === "LINE")
        const words = tableData.Blocks.filter(b => b.BlockType === "WORD")
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
                        cell.cellText = cell.words.join(" ")
                    })
                }
            })

            table.cols = table.cells.reduce(function(prev, current) {
                return (prev.ColumnIndex > current.ColumnIndex) ? prev.ColumnIndex : current.ColumnIndex
            })
            table.rows = table.cells.reduce(function(prev, current) {
                return (prev.RowIndex > current.RowIndex) ? prev.RowIndex : current.RowIndex
            })
        })
        console.log(tables)


        this.setState({
            tables,
            lines,
            words
        })
    }

    render() {
        console.log("tableData", this.state.tableData)
        const {file,selectedFile, isLoading, errorValidFile, tables, lines, words} = this.state
        const table = (tables && tables.length && tables[0]) || {}
        const tableCells = (tables && tables.length && tables[0].cells) || []
        const columns = []
        const data = []

        for(let i = 1; i <= table.cols; i++){
            columns.push({
                id: `Column ${i}`,
                Header: `Column ${i}`,
                accessor: `cell${i}`,
            })
        }

        for(let j = 1; j <= table.rows; j++){
            const cellObj = {}
            tableCells.forEach(cell => {
                if(cell.RowIndex === j){
                    cellObj[`cell${cell.ColumnIndex}`] = cell.cellText || ""
                }
            })
            data.push(cellObj)
        }

        if(isLoading){
          return <Spinner style={{ width: '3rem', height: '3rem' }} type="grow" />
        }
        return (
            <div className="flud-container" style={{overflow: "hidden"}}>
                <div className="row p-5">
                    <div className="col-sm-6">
                        <Card body>
                            <div className="input-group mb-3">
                                <div className="custom-file">
                                    <input type="file" accept=".jpeg,.png" className="custom-file-input" id="inputGroupFile02" onChange={this.onSelect} />
                                    <label className="custom-file-label" htmlFor="inputGroupFile02" aria-describedby="inputGroupFileAddon02">{(selectedFile && selectedFile.name) || "Choose File"}</label>
                                </div>
                                <div className="input-group-append">
                                    <button className="btn btn-outline-secondary" type="button" onClick={this.onFileUpload} >Upload</button>
                                </div>
                            </div>
                            <p className="text-danger">{errorValidFile}</p>
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
import React, {Component} from "react"
import ReactTable from 'react-table'
import "react-table/react-table.css"
import {Card, Pagination, PaginationItem, PaginationLink, Spinner} from 'reactstrap';
import axios from 'axios';

const S3BUCKET= "munivisor-docs-dev"

const TABS = [
    {name: "row-text", label: "Raw Text"},
    {name: "tables", label: "Tables"},
]

export default class Table extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tableData: {},
            file: {},
            selectedFile: null,
            isLoading: false,
            activeTab: "row-text"
        }
    }

    getBase64 = (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onerror = () => { reader.abort(); reject(new Error("Error parsing file"));}
            reader.readAsDataURL(file);
            reader.onload = function () {
                resolve({
                    // bytes: bytes,
                    base64StringFile: reader.result,
                    fileName: file.name,
                    fileType: file.type,
                    originalFile: file
                });
            }
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
        }
        xhr.onload = async () => {
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

            table.cols = table.cells.reduce((prev, current) => (prev.ColumnIndex > current.ColumnIndex) ? prev.ColumnIndex : current.ColumnIndex)
            table.rows = table.cells.reduce((prev, current) => (prev.RowIndex > current.RowIndex) ? prev.RowIndex : current.RowIndex)
        })
        console.log(tables)
        this.setState({
            tables,
            lines,
            words
        })
    }

    onTab = (e) => {
        this.setState({
            activeTab: e.target.name
        })
    }

    render() {
        console.log("tableData", this.state.tableData)
        const {file,selectedFile, activeTab, isLoading, errorValidFile, tables, lines, words} = this.state
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
                        </Card>
                    </div>
                    <div className="col-sm-6">
                        <Card className="p-2">
                            <div className="row p-2">
                                <div className="col-sm-12 mt-2">
                                    <div className="input-group">
                                        <div className="input-group-prepend">
                                            <label className="input-group-text">
                                                <i className="fas fa-search" />
                                            </label>
                                        </div>
                                        <input type="text" aria-label="Search text" className="form-control" placeholder="Type here to search"/>
                                    </div>
                                </div>
                            </div>
                            <nav>
                                <div className="nav nav-tabs" id="nav-tab" role="tablist">
                                    {
                                        TABS.map(tab => (
                                            <a className={`nav-item nav-link ${activeTab === tab.name ? "active" : ""}`}
                                               name={tab.name}
                                               onClick={this.onTab}
                                               aria-selected={activeTab === tab.name}>
                                                {tab.label}
                                            </a>
                                        ))
                                    }
                                </div>
                            </nav>
                            <div className="tab-content" id="nav-tabContent">
                                <div className={`tab-pane fade ${activeTab === "row-text" ? "show active" : ""}`} >Raw Text</div>
                                <div className={`tab-pane fade ${activeTab === "tables" ? "show active" : ""}`}>
                                    { columns ?
                                        <div className="row p-2">
                                            <div className="col-sm-12 mt-2">
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
                                        : null
                                    }
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }
}
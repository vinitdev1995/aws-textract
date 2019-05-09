import React, {Component} from "react"
import ReactTable from 'react-table'
import "react-table/react-table.css"
import {Card, CardBody, CardFooter, Pagination, PaginationItem, PaginationLink, Spinner} from 'reactstrap';
import axios from 'axios';

const S3BUCKET= "munivisor-docs-dev"

const TABS = [
    {name: "row-text", label: "Raw Text"},
    {name: "tables", label: "Tables"},
]
// const fileType = ["jpeg", "jpg", "png"]

export default class Textract extends Component {
    constructor(props) {
        super(props)
        this.state = {
            file: {},
            selectedFile: null,
            isLoading: false,
            activeTab: "row-text",
            rawText: "lines",
            tableIndex: 0
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
                const res = (response && response.data && response.data.blocks) || {}
                this.setState({
                    ...res,
                    file: base64Obj,
                    isLoading: false
                }/* ,()=> this.blockExtract() */)
            }).catch(error => {
                console.log(error);
            })
    }

    onSelect = (event) => {
        if(event.target.files.length){
            const file = event.target.files[0]
            if(((file && file.type === "image/png") || (file && file.type === "image/jpeg")) && (file && file.size < 5000000)){
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

    onTab = (e) => {
        this.setState({
            activeTab: e.target.name
        })
    }

    onPageChange = (i) =>{
        this.setState({
            tableIndex: i || 0
        })
    }

    onChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value || "lines"
        })
    }

    render() {
        const {file, rawText, selectedFile, activeTab, isLoading, errorValidFile, tables, lines, words, tableIndex} = this.state
        const table = (tables && tables.length && tables[tableIndex]) || {}
        const tableCells = (tables && tables.length && tables[tableIndex].cells) || []
        const columns = []
        const data = []
        for(let j = 1; j <= table.rows; j++){
            const cellObj = {}
            tableCells.forEach(cell => {
                if(cell.RowIndex === j){
                    cellObj[`cell${cell.ColumnIndex}`] = cell.cellText || ""
                }
            })
            data.push(cellObj)
        }

        for(let i = 1; i <= table.cols; i++){
            const header = (data && data.length && data[0]) || {}
            columns.push({
                id: header[`cell${i}`],
                Header: header[`cell${i}`],
                accessor: `cell${i}`,
            })
        }
        if(data && data.length){
            data.splice(0,1)
        }

        if(isLoading){
          return <Spinner style={{ width: '3rem', height: '3rem' }} type="grow" />
        }

        return (
            <div className="flud-container pt-3 pl-5 pr-5" style={{overflow: "hidden"}}>
                <h3 className="text-center text-primary pb-5">Otaras Textract Engine</h3>
                <div className="row">
                    <div className="col-sm-6">
                        <Card>
                            <CardBody>
                                <div className="input-group mb-3">
                                    <div className="custom-file">
                                        <input type="file" accept=".jpeg,.jpg,.png" className="custom-file-input" id="inputGroupFile02" onChange={this.onSelect} />
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
                            </CardBody>
                            <CardFooter className="text-left">
                                <p className="card-text">
                                    <small className="text-muted"> Note: Your document must be a .jpeg or .png. It must be no larger than 5MB. Reset document</small>
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="col-sm-6">
                        <Card className="p-2">
                            <nav>
                                <div className="nav nav-tabs" id="nav-tab" role="tablist">
                                    {
                                        TABS.map(tab => (
                                            <a key={tab.name} className={`nav-item nav-link ${activeTab === tab.name ? "active" : ""}`}
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
                                <div className={`tab-pane fade ${activeTab === "row-text" ? "show active" : ""}`} >
                                    <div className="row p-2">
                                        <div className="col-sm-10 mt-2">
                                            <div className="input-group">
                                                <div className="input-group-prepend">
                                                    <label className="input-group-text">
                                                        <i className="fas fa-search" />
                                                    </label>
                                                </div>
                                                <input type="text" aria-label="Search text" className="form-control" placeholder="Type here to search"/>
                                            </div>
                                        </div>
                                        <div  className="col-sm-2 mt-2">
                                            <div className="form-group">
                                                <select name="rawText" value={rawText || ""} className="form-control" onChange={this.onChange}>
                                                    <option value="lines">Lines</option>
                                                    <option value="words">Words</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    {
                                        rawText === "lines" ?
                                        <div className="text-justify">
                                            {
                                                lines && lines.length ? lines.map(line => (
                                                    <div key={line.Id} className="tag m-1">{line.Text}</div>
                                                )) : <p> No results, We can’t find any text. Please try another document. </p>
                                            }
                                        </div> :

                                        rawText === "words" ?
                                        <div className="text-justify">
                                            {
                                                words && words.length ? words.map(line => (
                                                    <div key={line.Id} className="tag m-1">{line.Text}</div>
                                                )) : <p> No results, We can’t find any text. Please try another document. </p>
                                            }
                                        </div>
                                        : null

                                    }
                                </div>
                                <div className={`tab-pane fade ${activeTab === "tables" ? "show active" : ""}`}>
                                    { columns && columns.length ?
                                        <div>
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
                                            <div className="row p-2">
                                                <div className="col-sm-12 mt-2">
                                                    {tables && tables.length &&
                                                    <Pagination size="sm" aria-label="Page navigation example">
                                                        <PaginationItem>
                                                            <PaginationLink disabled={tableIndex === 0} previous onClick={() => this.onPageChange(tableIndex-1)}/>
                                                        </PaginationItem>
                                                        {
                                                            tables.map((obj, i) => {
                                                                return (
                                                                    <PaginationItem key={i} active={tableIndex === i} onClick={() => this.onPageChange(i)}>
                                                                        <PaginationLink>{i + 1}</PaginationLink>
                                                                    </PaginationItem>
                                                                )
                                                            })
                                                        }
                                                        <PaginationItem>
                                                            <PaginationLink disabled={tableIndex === tables.length-1} next onClick={() => this.onPageChange(tableIndex+1)}/>
                                                        </PaginationItem>
                                                    </Pagination>}
                                                    <ReactTable
                                                        data={data}
                                                        columns={columns}
                                                        minRows={2}
                                                        className="-striped -highlight is-bordered"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        : <p> No results, We can’t find any text. Please try another document. </p>
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
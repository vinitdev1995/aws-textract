import React, {Component} from "react"
import Fuse from 'fuse.js'
import { Card } from 'reactstrap';
import Loader from "./SubComponents/Loader"
import "react-table/react-table.css"
import Header from "./SubComponents/Header";
import RawText from "./SubComponents/RawText";
import TablesText from "./SubComponents/TablesText";
import UploadDocument from "./SubComponents/UploadDocument";
import Forms from "./SubComponents/Forms";
import {getSignedUrlInfo, onUploadDocument} from "../Actions";

const S3BUCKET= "munivisor-docs-dev"

const TABS = [
    {name: "row-text", label: "Raw Text"},
    {name: "forms", label: "Forms"},
    {name: "tables", label: "Tables"},
];
// const fileType = ["jpeg", "jpg", "png"]
const options = {
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: []
};

export default class Textract extends Component {
    constructor(props) {
        super(props)
        this.state = {
            file: {},
            selectedFile: null,
            isLoading: false,
            activeTab: "row-text",
            rawText: "lines",
            searchRawText: "",
            searchForms: "",
            searchTableText: "",
            errorValidFile: "",
            tableIndex: 0,
            formFields: [],
            lines: [],
            words: [],
            tables: []
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
        const res = await getSignedUrlInfo(payload)
        return res
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
        xhr.open("PUT", (res && res.data && res.data.url) || "", true)
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
        const response = await onUploadDocument(params)
        if(response){
            const res = (response && response.data && response.data.blocks) || {}
            this.setState({
                ...res,
                file: base64Obj,
                errorValidFile: "",
                isLoading: false
            }/* ,()=> this.blockExtract() */)
        }else {
            this.setState({
                formFields: [],
                lines: [],
                words: [],
                tables: [],
                file: {},
                isLoading: false,
                errorValidFile: "We can’t find any text. Please try another document.",
                selectedFile: null
            })
        }
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
            [e.target.name]: e.target.value
        })
    }

    render() {
        const {file, rawText, selectedFile, searchTableText, searchForms, searchRawText, activeTab, isLoading, errorValidFile, tables, tableIndex} = this.state
        let {lines, words, formFields} = this.state
        const table = (tables && tables.length && tables[tableIndex]) || {}
        const tableCells = (tables && tables.length && tables[tableIndex].cells) || []
        const columns = []
        let data = []
        options.keys = []

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
                id: `cell${i}`,
                Header: header[`cell${i}`],
                accessor: `cell${i}`,
            })
            options.keys.push({
                name: `cell${i}`,
                weight: 0.3
            })
        }
        if(data && data.length){
            data.splice(0,1)
        }

        if(activeTab === "row-text" && searchRawText){
            options.keys = [{
                name: "Text",
                weight: 0.3
            }]
            console.log(options)
            if(rawText === "lines" && searchRawText){
                console.log(lines, options)
                lines = new Fuse(lines, options)
                lines = lines.search(searchRawText);
            }
            if(rawText === "words" && searchRawText){
                console.log(words, options)
                words = new Fuse(words, options)
                words = words.search(searchRawText);
            }
        }

        if(activeTab === "forms" && searchForms){
            console.log(data, options)
            options.keys = [{
                name: "key",
                weight: 0.3
            },{
                name: "value",
                weight: 0.7
            }]
            formFields = new Fuse(formFields, options)
            formFields = formFields.search(searchForms);
        }

        if(activeTab === "tables" && searchTableText){
            console.log(data, options)
            data = new Fuse(data, options)
            data = data.search(searchTableText);
        }

        return (
            <div>
                <Header/>
                <div className="flud-container pt-3 pl-3 pr-3" style={{overflow: "hidden"}}>
                    {isLoading ? <Loader/> : null}
                    <div className="row">
                       <UploadDocument
                           onSelect={this.onSelect}
                           selectedFile={selectedFile}
                           onFileUpload={this.onFileUpload}
                           errorValidFile={errorValidFile}
                           file={file}
                       />
                        <div className="col-xl-6 mt-2">
                            <Card className="p-2">
                                <nav>
                                    <div className="nav nav-tabs" id="nav-tab" role="tablist">
                                        {
                                            TABS.map(tab => (
                                                <a key={tab.name}
                                                   className={`nav-item nav-link ${activeTab === tab.name ? "active" : ""}`}
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
                                    <RawText
                                        activeTab={activeTab}
                                        onChange={this.onChange}
                                        rawText={rawText}
                                        searchText={searchRawText}
                                        lines={lines}
                                        words={words}
                                    />
                                    <Forms
                                        activeTab={activeTab}
                                        onChange={this.onChange}
                                        searchText={searchForms}
                                        forms={formFields}
                                    />
                                    <TablesText
                                        activeTab={activeTab}
                                        columns={columns}
                                        onChange={this.onChange}
                                        searchText={searchTableText}
                                        tables={tables}
                                        tableIndex={tableIndex}
                                        onPageChange={this.onPageChange}
                                        data={data}
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

import React, {Component} from "react"
import ReactTable from 'react-table'
import "react-table/react-table.css"
import logo from './logo.svg';
import {Card, CardImg, Input, Pagination, PaginationItem, PaginationLink} from 'reactstrap';
import axios from 'axios';

export default class Table extends Component {
    constructor(props) {
        super(props)
        this.state = {
            tableData: {}
        }
    }

    onUpload = () => {
        const params = {
            "Document": {
                "S3Object": {
                    Bucket: process.env.S3BUCKET,
                    Name: "TableCapture.PNG"
                }
            },
            "FeatureTypes": [
                "TABLES",
                "FORMS"
            ]
        }
        axios.post('http://localhost:8000/getAwsTextract', params)
            .then(response => {
                this.setState({
                    tableData: (response && response.data && response.data.data) || {}
                })
            })
            .catch(error => {
                console.log(error);
            });
    }

    render() {
        console.log("tableData", this.state.tableData)
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
                                <CardImg top width="20%" height="20%" src={logo} alt="Card image cap"/>
                                <Input type="file" onClick={this.onUpload} name="file"/>
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
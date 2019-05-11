import React from "react"
import {Pagination, PaginationItem, PaginationLink} from "reactstrap";
import ReactTable from "react-table";

const TablesText = ({activeTab, columns, searchText, onChange, tables, tableIndex, onPageChange, data}) => {
    return (
        <div className={`tab-pane fade ${activeTab === "tables" ? "show active" : ""}`}>
                <div>
                    <div className="row p-2">
                        <div className="col-sm-12 mt-2">
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <label className="input-group-text">
                                        <i className="fas fa-search"/>
                                    </label>
                                </div>
                                <input type="text" name="searchTableText"
                                       aria-label="Search text" className="form-control"
                                       placeholder="Type here to search"
                                       value={searchText} onChange={onChange}/>
                            </div>
                        </div>
                    </div>
                    {columns && columns.length ?
                    <div className="row p-2">
                        <div className="col-sm-12 mt-2">
                            {tables && tables.length &&
                            <Pagination size="sm" aria-label="Page navigation example">
                                <PaginationItem>
                                    <PaginationLink disabled={tableIndex === 0} previous
                                                    onClick={() => onPageChange(tableIndex - 1)}/>
                                </PaginationItem>
                                {
                                    tables.map((obj, i) => {
                                        return (
                                            <PaginationItem key={i}
                                                            active={tableIndex === i}
                                                            onClick={() => onPageChange(i)}>
                                                <PaginationLink>{i + 1}</PaginationLink>
                                            </PaginationItem>
                                        )
                                    })
                                }
                                <PaginationItem>
                                    <PaginationLink
                                        disabled={tableIndex === tables.length - 1} next
                                        onClick={() => onPageChange(tableIndex + 1)}/>
                                </PaginationItem>
                            </Pagination>}
                            <ReactTable
                                data={data}
                                columns={columns}
                                minRows={2}
                                className="-striped -highlight is-bordered"
                            />
                        </div>
                    </div> : <p className="text-left"> No results, We can’t find any text. Please try another document. </p>
                    }
                </div>
        </div>
    )
}
export default TablesText

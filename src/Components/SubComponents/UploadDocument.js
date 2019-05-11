import React from "react"
import {Card, CardBody, CardFooter} from "reactstrap";

const UploadDocument = ({onSelect, selectedFile, onFileUpload, errorValidFile, file}) => {
    return (
        <div className="col-xl-6 mt-2">
            <Card>
                <CardBody>
                    <div className="input-group mb-3">
                        <div className="custom-file">
                            <input type="file" accept=".jpeg,.jpg,.png" className="custom-file-input"
                                   id="inputGroupFile02" onChange={onSelect}/>
                            <label className="custom-file-label" style={{whiteSpace: "nowrap",overflow: "hidden",textOverflow: "ellipsis"}}>{(selectedFile && selectedFile.name) || "Choose File"}</label>
                        </div>
                        <div className="input-group-append">
                            <button className="btn btn-outline-secondary" type="button"
                                    onClick={onFileUpload}>Upload
                            </button>
                        </div>
                    </div>
                    <p className="text-danger text-left" style={{fontSize: "12px"}}>{errorValidFile}</p>
                    {file && file.base64StringFile ?
                        <div>
                            <img className="img-fluid img-thumbnail"
                                 style={{height: "auto", width: "auto"}}
                                 src={(file && file.base64StringFile) || ""} alt="Card image cap"/>
                        </div>
                        : null
                    }
                </CardBody>
                <CardFooter className="text-left">
                    <p className="card-text">
                        <small className="text-muted">
                            Note: Your document must be a .jpeg or .png. It must be no larger than 5MB.
                        </small>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
export default UploadDocument

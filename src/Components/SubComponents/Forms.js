import React from "react"

const Forms = ({activeTab, onChange, searchText, forms}) => {
    return (
        <div className={`tab-pane fade ${activeTab === "forms" ? "show active" : ""}`}>
            <div className="row p-2">
                <div className="col-sm-12 mt-2">
                    <div className="input-group">
                        <div className="input-group-prepend">
                            <label className="input-group-text">
                                <i className="fas fa-search"/>
                            </label>
                        </div>
                        <input type="text" name="searchForms" aria-label="Search text"
                               className="form-control" placeholder="Type here to search"
                               value={searchText} onChange={onChange}/>
                    </div>
                </div>
            </div>
            <div className="row p-2">
                {
                    forms && forms.length ? forms.map(form => (
                            <div  key={form.Id} className="col-sm-6">
                                <div className="form-group">
                                    <label className="float-left">{form.key}</label>
                                    <textarea className="form-control" value={form.value || ""} rows="3" disabled />
                                </div>
                            </div>

                    )) : <p> No results, We can’t find any text. Please try another document. </p>
                }
            </div>
        </div>
    )
}
export default Forms

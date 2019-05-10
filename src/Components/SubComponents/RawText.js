import React from "react"

const RawText = ({activeTab, onChange, searchText, rawText, lines, words}) => {
    return (
        <div className={`tab-pane fade ${activeTab === "row-text" ? "show active" : ""}`}>
            <div className="row p-2">
                <div className="col-sm-10 mt-2">
                    <div className="input-group">
                        <div className="input-group-prepend">
                            <label className="input-group-text">
                                <i className="fas fa-search"/>
                            </label>
                        </div>
                        <input type="text" name="searchRawText" aria-label="Search text"
                               className="form-control" placeholder="Type here to search"
                               value={searchText} onChange={onChange}/>
                    </div>
                </div>
                <div className="col-sm-2 mt-2">
                    <div className="form-group">
                        <select name="rawText" value={rawText || ""}
                                className="form-control" onChange={onChange}>
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
                            )) : <p> No results, We can’t find any text. Please try another
                                document. </p>
                        }
                    </div> :

                    rawText === "words" ?
                        <div className="text-justify">
                            {
                                words && words.length ? words.map(line => (
                                    <div key={line.Id} className="tag m-1">{line.Text}</div>
                                )) : <p> No results, We can’t find any text. Please try
                                    another document. </p>
                            }
                        </div>
                        : null

            }
        </div>
    )
}
export default RawText

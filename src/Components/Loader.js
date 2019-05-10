import React from "react"
import loader from "../images/loader.gif"

const Loader = () => (
    <div style={{ position: "fixed", top: "0", left:"0",right:"0",bottom:"0", height: "100%", width: "100%", backgroundColor: '#ffffff', opacity: 0.6, zIndex: 1000 }}>
        <div style={{ position: "absolute", textAlign: "center", top: "47%", left: "47%", zIndex: 1001 }}>
            <img src={loader} height={100} width={100} alt="loader" />
        </div>
    </div>
)

export default Loader

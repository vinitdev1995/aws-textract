import axios from "axios";

const muniApiBaseURL = "http://localhost:8000"

export const getSignedUrlInfo = async (payload) => {
    try {
        const res = await axios.post(`${muniApiBaseURL}/get-signed-url`, payload)
        if(res && res.status === 200){
            return res
        }
        return null
    } catch (err) {
        console.log("err in getSignedUrl ", err.message)
        return null
    }
}

export const onUploadDocument = async (payload) => {
    try {
        const res = await axios.post(`${muniApiBaseURL}/getAwsTextract`, payload)
        if(res){
            return res
        }
        return null
    } catch (err) {
        console.log("err in getSignedUrl ", err.message)
        return null
    }
}
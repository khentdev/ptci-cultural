import axios from "axios";
import { VITE_API_URL } from "../config/load.env";
const axiosInstance = axios.create({
    baseURL: VITE_API_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true,
})
export default axiosInstance


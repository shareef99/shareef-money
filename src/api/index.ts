import { useAuthToken } from "@/store/auth";
import axios from "axios";

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

export const setUpInterceptors = () => {
  axiosClient.interceptors.request.use(
    (request) => {
      const token = useAuthToken();

      const whitelistUrls = ["/users/signin"];

      if (request.url && whitelistUrls.includes(request.url)) {
        return request;
      }

      request.headers["Authorization"] = `Bearer ${token}`;
      return request;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axiosClient.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalConfig = error.config;
      if (error.response && originalConfig.url !== "/user/signin") {
        if (error.response.status === 401 && !originalConfig._retry) {
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    }
  );
};

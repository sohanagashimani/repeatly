import axios, { AxiosRequestConfig } from "axios";
import { auth } from "./firebase";

const apiHelper = async ({
  slug,
  version = "v1",
  method = "GET",
  data,
  url,
}: {
  slug: string;
  version?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  url?: string;
}) => {
  try {
    if (!auth.currentUser) {
      throw new Error("User not authenticated");
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const apiUrl = url ?? `${baseUrl}/api/${version}/${slug}`;

    const token = await auth.currentUser.getIdToken();
    const bearer = `Bearer ${token}`;

    const config: AxiosRequestConfig = {
      method: method.toLowerCase() as any,
      url: apiUrl,
      headers: {
        Authorization: bearer,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: false,
    };

    if (["POST", "PUT", "PATCH"].includes(method) && data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || error.message;
      const errorObject = new Error(errorMessage);
      (errorObject as any).status = error.response?.status;
      (errorObject as any).data = error.response?.data;
      throw errorObject;
    }
    throw error;
  }
};

export default apiHelper;

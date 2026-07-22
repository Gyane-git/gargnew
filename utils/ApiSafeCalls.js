import { baseUrl } from "./config";
// // import getToken from "@/app/api/auth/GetToken";

// export const apiRequest = async (url, tokenReq = true, options = {}) => {
//   url = `${baseUrl}${url}`;
//   const token = localStorage.getItem("token");

//   const headers = {
//     ...(tokenReq && token && { Authorization: `Bearer ${token}` }),
//     ...(options.method !== "GET" && { "Content-Type": "application/json" }),
//     ...options.headers,
//   };
//   const response = await fetch(url, { ...options, headers });
//   let data;
//   // // console.log("data", data);
//   try {
//     data = await response.json();
//   } catch (e) {
//     console.error("Error in apiRequest:", e);
//     return {
//       success: false,
//       message: "An error from server occurred while processing the request .",
//     };
//   }
//   if (data.success || response.ok) {
//     return data;
//   } else {
//     return data;
//   }
// };

// export const apiPostRequest = async (url, data, tokenReq = true) =>
//   apiRequest(url, tokenReq, { method: "POST", body: JSON.stringify(data) });
export const getToken = () => {
  return sessionStorage.getItem("token");
}

const getApiBaseUrl = () => {
  if (typeof window === "undefined") return baseUrl;

  try {
    const configuredUrl = new URL(baseUrl);
    const currentUrl = new URL(window.location.origin);

    if (["localhost", "127.0.0.1"].includes(configuredUrl.hostname)) {
      return `${window.location.origin}/api/v1`;
    }
  } catch {}

  return baseUrl || `${window.location.origin}/api/v1`;
};

export const apiRequest = async (url, tokenReq = true, options = {}) => {
  url = `${getApiBaseUrl()}${url}`;
  const token = sessionStorage.getItem("token");
  const headers = {
    ...(tokenReq && token && { Authorization: `Bearer ${token}` }),
    ...(options.method !== "GET" && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 30000);
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    // console.log("Network error:", err);
    // console.warn(err);
    if (err?.name === "AbortError") {
      return {
        success: false,
        message: "Request timed out. Please try again.",
      };
    }
    return {
      success: false,
      message: "Network error or server unreachable.",
    };
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    clearTimeout(timeoutId);
    // console.log("Invalid JSON from server:", e);
    // console.warn(e);
    return {
      success: false,
      message: "Server sent invalid JSON.",
    };
  }

  clearTimeout(timeoutId);

  if (data.success || response.ok) {
    return data;
  } else {
    // Log detailed error
    // console.log("API error response:", data);
    // console.warn(data);
    return data;
  }
};

export const apiPostRequest = async (url, data, tokenReq = true) =>
  apiRequest(url, tokenReq, { method: "POST", body: JSON.stringify(data) });

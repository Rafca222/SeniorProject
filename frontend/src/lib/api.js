import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Shared across every request in the app. If several API calls hit a 401
// at the same moment -- e.g. Home.jsx firing trending/featured/directory
// together right when the access token has just expired -- they must all
// wait on the SAME refresh call instead of each firing their own.
//
// This matters specifically because refresh tokens now rotate (single-use,
// see auth.service.ts). Without this guard, the first parallel call would
// successfully refresh and consume the old refresh token; every other
// parallel call would then present that same now-stale token, get rejected
// as "already used," and wrongly log the user out.
let refreshPromise = null;

function performRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return Promise.reject(new Error('No refresh token stored'));

  return axios
    .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    });
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);


import Cookies from "js-cookie";

const DEFAULT_OPTIONS = {
  path: "/",
  expires: 7,         
  sameSite: "lax" as const,
  secure: import.meta.env.PROD, 
};

export const setCookie = (
  key: string,
  value: string,
  options?: Cookies.CookieAttributes
) => {
  Cookies.set(key, value, { ...DEFAULT_OPTIONS, ...options });
};

export const getCookie = (key: string) => {
  return Cookies.get(key);
};

export const removeCookie = (key: string) => {
  Cookies.remove(key, { path: "/" });
};

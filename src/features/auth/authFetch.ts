export const CMS_AUTH_EXPIRED_EVENT = 'lng79:auth-expired';

export const authFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);
  if (response.status === 401) window.dispatchEvent(new Event(CMS_AUTH_EXPIRED_EVENT));
  return response;
};

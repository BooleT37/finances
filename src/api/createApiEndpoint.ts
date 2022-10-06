import queryString from "query-string";
type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function fetchData<RequestBody, RequestQueryParams extends object>(
  url: string,
  method: HTTPMethod,
  body: RequestBody,
  query?: RequestQueryParams
) {
  let path = `${process.env.REACT_APP_API_URL}/${url}`;
  if (query) {
    path = `${path}?${queryString.stringify(query)}`;
  }

  return fetch(path, {
    method: method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "content-type": "application/json",
    },
  });
}

export function createApiEndpoint<
  RequestBody,
  RequestQueryParams extends object
>(url: string, method: HTTPMethod) {
  return async (body: RequestBody, query?: RequestQueryParams) =>
    fetchData(url, method, body, query);
}

export function createApiEndpointWithResponse<
  RequestBody,
  RequestQueryParams extends object,
  ResponseFromApi
>(url: string, method: HTTPMethod) {
  return async (
    body: RequestBody,
    query?: RequestQueryParams
  ): Promise<ResponseFromApi> => {
    const response = await fetchData(url, method, body, query);
    return response.json();
  };
}

export function createGetApiEndpoint<Response>(url: string) {
  return () =>
    createApiEndpointWithResponse<undefined, never, Response>(
      url,
      "GET"
    )(undefined);
}

export function createDeleteApiEndpoint(url: string) {
  return (id: number) =>
    createApiEndpoint<undefined, { id: number }>(url, "DELETE")(undefined, {
      id,
    });
}

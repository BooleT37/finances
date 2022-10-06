import queryString from "query-string";
type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export function createApiEndpoint<
  RequestBody,
  RequestQueryParams extends object,
  ResponseFromApi
>(url: string, method: HTTPMethod) {
  return async (
    body: RequestBody,
    query?: RequestQueryParams
  ): Promise<ResponseFromApi> => {
    let path = `${process.env.REACT_APP_API_URL}/${url}`;
    if (query) {
      path = `${path}${queryString.stringify(query)}`;
    }

    const response = await fetch(path, {
      method: method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "content-type": "application/json",
      },
    });

    return response.json();
  };
}

export function createGetApiEndpoint<Response>(url: string) {
  return () =>
    createApiEndpoint<undefined, never, Response>(url, "GET")(undefined);
}

export function createDeleteApiEndpoint(url: string) {
  return (id: number) =>
    createApiEndpoint<undefined, { id: number }, never>(url, "DELETE")(
      undefined,
      { id }
    );
}

import { http, HttpResponse } from "msw";

export function handlers(url: string, contentTypes: Record<string, object[]>) {
  const contentTypeHandlers = Object.keys(contentTypes).map((contentType) => {
    const contentTypeUrl = `${url}/${contentType}s`;
    const data = contentTypes[contentType];
    return http.get(contentTypeUrl, ({ request }) => {
      const searchParams = new URL(request.url).searchParams;
      const pageSize = Number(
        searchParams.get("pagination[pageSize]") || data.length,
      );
      const pageCount = Math.ceil(data.length / pageSize);
      const page = Math.max(
        0,
        Math.min(
          Number(searchParams.get("pagination[page]") || 1) - 1,
          pageCount - 1,
        ),
      );
      return HttpResponse.json({
        data: data.slice(page * pageSize, page * pageSize + pageSize),
        meta: {
          pagination: { pageCount, page, pageSize, total: data.length },
        },
      });
    });
  });
  const emptyContentTypeUrl = `${url}/emptys`;
  const invalidResponseShapeUrl = `${url}/invalidShapes`;
  const serverErrorUrl = `${url}/errors`;
  return [
    ...contentTypeHandlers,
    // this route successfully returns nothing
    http.get(emptyContentTypeUrl, () =>
      HttpResponse.json({
        data: [],
        meta: { pagination: { pageCount: 1, page: 1, pageSize: 1, total: 0 } },
      }),
    ),

    // this route doesn't return the pagination
    http.get(invalidResponseShapeUrl, () =>
      HttpResponse.json({
        data: Object.values(contentTypes)[0],
        meta: {},
      }),
    ),

    // this route returns server error
    http.get(serverErrorUrl, () => HttpResponse.error()),
  ];
}

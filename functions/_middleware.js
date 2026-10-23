// 301: old synlig14.pages.dev (production host) -> https://synlig14.no
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === "synlig14.pages.dev" || url.hostname === "www.synlig14.no") {
    url.hostname = "synlig14.no";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return next();
}

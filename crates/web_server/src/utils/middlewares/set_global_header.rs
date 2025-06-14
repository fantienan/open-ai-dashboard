use axum::{
  http::{HeaderValue, header},
  response::Response,
};

pub async fn set_global_header_middleware(mut res: Response) -> Response {
  if !res.headers().contains_key(header::CONTENT_TYPE) {
    res.headers_mut().insert(
      header::CONTENT_TYPE,
      HeaderValue::from_static(mime::APPLICATION_JSON.as_ref()),
    );
  }

  if !res
    .headers()
    .contains_key(header::ACCESS_CONTROL_EXPOSE_HEADERS)
  {
    res.headers_mut().insert(
      header::ACCESS_CONTROL_EXPOSE_HEADERS,
      HeaderValue::from_static("*"),
    );
  }
  res
}

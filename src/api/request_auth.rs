//! API 请求鉴权 helper。

use actix_web::{HttpRequest, http::header};
use cookie::Cookie;

pub(crate) const ACCESS_COOKIE: &str = "aster_access";

pub(crate) fn request_cookie(req: &HttpRequest, name: &str) -> Option<String> {
    let mut value = None;
    for header in req.headers().get_all(header::COOKIE) {
        let header = std::str::from_utf8(header.as_bytes()).ok()?;
        if value.is_none() {
            value = Cookie::split_parse_encoded(header)
                .filter_map(Result::ok)
                .find(|cookie| cookie.name() == name)
                .map(|cookie| cookie.value().to_owned());
        }
    }
    value
}

pub(crate) fn access_cookie_token(req: &HttpRequest) -> Option<String> {
    request_cookie(req, ACCESS_COOKIE)
}

pub(crate) fn bearer_token(req: &HttpRequest) -> Option<String> {
    req.headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .map(str::to_string)
}

pub(crate) fn access_token(req: &HttpRequest) -> Option<String> {
    access_cookie_token(req).or_else(|| bearer_token(req))
}

#[cfg(test)]
mod tests {
    use super::{ACCESS_COOKIE, access_cookie_token, access_token, bearer_token};
    use actix_web::{http::header, test::TestRequest};

    #[test]
    fn access_token_prefers_cookie_over_bearer_header() {
        let req = TestRequest::get()
            .insert_header((header::AUTHORIZATION, "Bearer bearer-token"))
            .insert_header((header::COOKIE, format!("{ACCESS_COOKIE}=cookie-token")))
            .to_http_request();

        assert_eq!(access_cookie_token(&req).as_deref(), Some("cookie-token"));
        assert_eq!(bearer_token(&req).as_deref(), Some("bearer-token"));
        assert_eq!(access_token(&req).as_deref(), Some("cookie-token"));
    }

    #[test]
    fn access_token_reads_bearer_header_when_cookie_missing() {
        let req = TestRequest::get()
            .insert_header((header::AUTHORIZATION, "Bearer bearer-token"))
            .to_http_request();

        assert!(access_cookie_token(&req).is_none());
        assert_eq!(bearer_token(&req).as_deref(), Some("bearer-token"));
        assert_eq!(access_token(&req).as_deref(), Some("bearer-token"));
    }
}

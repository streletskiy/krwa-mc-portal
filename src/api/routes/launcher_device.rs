//! Short-lived launcher pairing. The phone sees only the public code.
use crate::db::repository::minecraft_profile_repo;
use crate::entities::launcher_device::{ActiveModel, Column, Entity};
use crate::errors::Result;
use crate::runtime::AppState;
use crate::services::{auth_service, yggdrasil_service};
use crate::utils::{hash::sha256_hex, id::new_unsigned_uuid};
use actix_web::{HttpRequest, HttpResponse, web};
use chrono::Utc;
use sea_orm::sea_query::Expr;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::Deserialize;
use serde_json::json;

const TTL: i64 = 600;
#[derive(Deserialize)]
struct Start {
    client_token: String,
}
#[derive(Deserialize)]
struct Decision {
    code: String,
    profile: Option<String>,
}
#[derive(Deserialize)]
struct Poll {
    code: String,
    secret: String,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/launcher-device")
            .route("/start", web::post().to(start))
            .route("/confirm/{code}", web::get().to(details))
            .route("/decision", web::post().to(decide))
            .route("/poll", web::post().to(poll)),
    );
}

fn valid(code: &str) -> bool {
    code.len() == 32 && code.bytes().all(|c| c.is_ascii_hexdigit())
}

async fn start(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<Start>,
) -> Result<HttpResponse> {
    if body.client_token.is_empty()
        || body.client_token.len() > 80
        || !body
            .client_token
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-')
    {
        return Ok(HttpResponse::BadRequest().finish());
    }
    let origin = auth_service::peer_ip(&req).unwrap_or_default();
    if let Some(rejection) = state
        .yggdrasil_rate_limiter()
        .check_authenticate(&format!("device:{origin}"))
    {
        return Ok(rejection.into_response());
    }
    let now = Utc::now().timestamp();
    Entity::delete_many()
        .filter(Column::Expires.lte(now))
        .exec(state.writer_db())
        .await?;
    let code = new_unsigned_uuid();
    let secret = new_unsigned_uuid();
    ActiveModel {
        code: Set(code.clone()),
        secret_hash: Set(sha256_hex(secret.as_bytes())),
        client_token: Set(body.client_token.clone()),
        expires: Set(now + TTL),
        user_id: Set(None),
        profile: Set(None),
    }
    .insert(state.writer_db())
    .await?;
    Ok(HttpResponse::Ok()
        .insert_header(("Cache-Control", "no-store"))
        .json(json!({"code":code,"secret":secret,"expires_in":TTL,"interval":4})))
}

async fn details(
    state: web::Data<AppState>,
    req: HttpRequest,
    code: web::Path<String>,
) -> Result<HttpResponse> {
    let user = auth_service::current_user(state.get_ref(), &req).await?;
    let code = code.into_inner();
    if !valid(&code)
        || Entity::find_by_id(code)
            .filter(Column::Expires.gt(Utc::now().timestamp()))
            .filter(Column::UserId.is_null())
            .one(state.writer_db())
            .await?
            .is_none()
    {
        return Ok(HttpResponse::Gone().finish());
    }
    let profiles = minecraft_profile_repo::list_by_user(state.reader_db(), user.id).await?;
    Ok(HttpResponse::Ok().insert_header(("Cache-Control","no-store")).json(json!({"profiles":profiles.iter().map(|p|json!({"id":p.uuid,"name":p.name})).collect::<Vec<_>>()})))
}

async fn decide(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<Decision>,
) -> Result<HttpResponse> {
    if crate::api::request_auth::access_cookie_token(&req).is_some() {
        crate::api::middleware::csrf::ensure_double_submit_token(&req)?;
    }
    let user = auth_service::current_user(state.get_ref(), &req).await?;
    if user.must_change_password || !valid(&body.code) {
        return Ok(HttpResponse::Forbidden().finish());
    }
    if let Some(profile) = &body.profile {
        if !minecraft_profile_repo::list_by_user(state.writer_db(), user.id)
            .await?
            .iter()
            .any(|p| &p.uuid == profile)
        {
            return Ok(HttpResponse::Forbidden().finish());
        }
    }
    let rows = Entity::update_many()
        .col_expr(Column::UserId, Expr::value(user.id))
        .col_expr(Column::Profile, Expr::value(body.profile.clone()))
        .filter(Column::Code.eq(&body.code))
        .filter(Column::Expires.gt(Utc::now().timestamp()))
        .filter(Column::UserId.is_null())
        .exec(state.writer_db())
        .await?
        .rows_affected;
    Ok(if rows == 1 {
        HttpResponse::NoContent()
    } else {
        HttpResponse::Gone()
    }
    .finish())
}

async fn poll(
    state: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<Poll>,
) -> Result<HttpResponse> {
    if !valid(&body.code) || !valid(&body.secret) {
        return Ok(HttpResponse::Gone().finish());
    }
    let secret_hash = sha256_hex(body.secret.as_bytes());
    let Some(grant) = Entity::find_by_id(body.code.clone())
        .filter(Column::SecretHash.eq(&secret_hash))
        .filter(Column::Expires.gt(Utc::now().timestamp()))
        .one(state.writer_db())
        .await?
    else {
        return Ok(HttpResponse::Gone().finish());
    };
    let Some(user_id) = grant.user_id else {
        return Ok(HttpResponse::Accepted().finish());
    };
    let rows = Entity::delete_many()
        .filter(Column::Code.eq(&body.code))
        .filter(Column::SecretHash.eq(secret_hash))
        .filter(Column::Expires.gt(Utc::now().timestamp()))
        .exec(state.writer_db())
        .await?
        .rows_affected;
    if rows != 1 {
        return Ok(HttpResponse::Gone().finish());
    }
    let Some(profile) = grant.profile else {
        return Ok(HttpResponse::Forbidden().finish());
    };
    match yggdrasil_service::device_session(
        state.get_ref(),
        user_id,
        &profile,
        grant.client_token,
        &req,
    )
    .await
    {
        Ok(session) => Ok(HttpResponse::Ok()
            .insert_header(("Cache-Control", "no-store"))
            .json(session)),
        Err(_) => Ok(HttpResponse::Forbidden().finish()),
    }
}

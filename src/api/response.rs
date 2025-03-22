use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::Serialize;
use serde_json::{json, Value};

#[derive(Serialize)]
pub struct ApiResponse<T>
where
    T: Serialize,
{
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T>
where
    T: Serialize,
{
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
        }
    }

    pub fn message(msg: &str) -> Self {
        Self {
            success: true,
            data: None,
            message: Some(msg.to_string()),
        }
    }

    pub fn error(msg: &str) -> Self {
        Self {
            success: false,
            data: None,
            message: Some(msg.to_string()),
        }
    }
}

impl<T> IntoResponse for ApiResponse<T>
where
    T: Serialize,
{
    fn into_response(self) -> axum::response::Response {
        let status = if self.success {
            StatusCode::OK
        } else {
            StatusCode::BAD_REQUEST
        };

        let body = Json(json!({
            "success": self.success,
            "data": self.data,
            "message": self.message,
        }));

        (status, body).into_response()
    }
}

// Pagination response wrapper
#[derive(Serialize)]
pub struct PaginatedResponse<T>
where
    T: Serialize,
{
    pub items: Vec<T>,
    pub total: u64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

impl<T> PaginatedResponse<T>
where
    T: Serialize,
{
    pub fn new(items: Vec<T>, total: u64, page: u32, per_page: u32) -> Self {
        let total_pages = ((total as f64) / (per_page as f64)).ceil() as u32;
        Self {
            items,
            total,
            page,
            per_page,
            total_pages,
        }
    }
}

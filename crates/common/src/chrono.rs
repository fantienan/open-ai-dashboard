use chrono::{DateTime, ParseError, Utc};

pub static DATE_FORMAT: &str = "%Y-%m-%dT%H:%M:%S%.3fZ";

pub fn gen_now_date_time_string() -> String {
  Utc::now().format(DATE_FORMAT).to_string()
}

pub fn string_to_date_time(date_time_str: &String) -> Result<DateTime<Utc>, ParseError> {
  Ok(DateTime::parse_from_rfc3339(&date_time_str)?.with_timezone(&Utc))
}

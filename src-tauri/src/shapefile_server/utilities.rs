use super::shapefile_to_geojson::convert_shapefile_to_geojson;
use common::response::BizResult;
use futures::{StreamExt, stream};
use geo_types::{LineString, Point, Polygon};
use regex::Regex;
use serde_json::json;
use shapefile::{PolygonRing, Shape, dbase};
use std::{path::Path, sync::Arc};
use tokio::sync::Mutex;
use wkt::Wkt;

pub async fn shapefile_to_geojson(shapefile_path: &str) -> Result<serde_json::Value, String> {
  let feature_collection = convert_shapefile_to_geojson(shapefile_path)
    .await
    .map_err(|e| format!("转换失败: {}", e));

  let geojson_output = serde_json::to_string_pretty(&feature_collection);

  match geojson_output {
    Ok(geojson) => Ok(json!(BizResult::ok(Some(geojson)))),
    Err(e) => return Err(format!("序列化失败: {}", e)),
  }
}

pub async fn shapefile_to_record(
  shapefile_path: &str,
) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
  let base_path = Path::new(shapefile_path);
  let shp_path = base_path.with_extension("shp");
  let mut shp_reader = shapefile::Reader::from_path(shp_path.clone())?;
  let shape_records: Vec<_> = shp_reader.iter_shapes_and_records().collect();
  let properties = Arc::new(Mutex::new(Vec::new()));

  let tasks = stream::iter(shape_records.into_iter())
    .map(|shape_record| {
      let properties = Arc::clone(&properties);
      tokio::spawn(async move { process_shape_record(shape_record, properties).await })
    })
    .buffer_unordered(num_cpus::get());
  tasks.for_each(|_| async {}).await;

  let data = properties.lock().await.clone();
  Ok(json!(BizResult::ok(Some(data))))
}

async fn process_shape_record(
  shape_record: Result<(Shape, dbase::Record), shapefile::Error>,
  properties: Arc<Mutex<Vec<serde_json::Value>>>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  let (shape, record) = shape_record?;

  let mut propertie = serde_json::Map::new();
  let re_numeric = Regex::new(r"Numeric\(Some\(([0-9]+(\.[0-9]+)?)\)\)").unwrap();
  let re_character = Regex::new(r#"^Character\(Some\("(.+)"\)\)"#).unwrap();
  let wkt_value = match shape {
    Shape::Point(_) => process_point_wkt(&shape),
    Shape::Polyline(_) => process_line_wkt(&shape),
    Shape::Polygon(_) => process_polygon_wkt(&shape),
    _ => Err("Unsupported shape type".to_string()),
  };

  let wkt_string = match wkt_value {
    Ok(wkt) => wkt.to_string(),
    Err(e) => format!("Error converting shape to WKT: {}", e),
  };
  propertie.insert("wkt".to_string(), serde_json::Value::String(wkt_string));

  for (field, value) in record.into_iter() {
    let value_string = value.to_string();
    let value_json = match value_string.as_str() {
      "Numeric(None)" => serde_json::Value::Null,
      "Character(None)" => serde_json::Value::Null,
      _ => {
        if let Some(caps) = re_numeric.captures(&value_string) {
          let number_str = caps.get(1).map_or("", |m| m.as_str());
          if let Ok(number) = number_str.parse::<f64>() {
            serde_json::json!(number)
          } else {
            serde_json::json!(value_string)
          }
        } else if let Some(caps) = re_character.captures(&value_string) {
          let string = caps.get(1).map_or("", |m| m.as_str());
          serde_json::json!(string)
        } else {
          serde_json::json!(value_string)
        }
      }
    };
    propertie.insert(field.to_string(), value_json);
  }
  properties
    .lock()
    .await
    .push(serde_json::Value::Object(propertie));
  Ok(())
}

fn process_polygon_wkt(shape: &Shape) -> Result<Wkt<f64>, String> {
  let wkt_value = match shape {
    Shape::Polygon(polygon) => {
      // 分离外环和内环
      let mut exterior = None;
      let mut interiors = Vec::new();

      for ring in polygon.rings() {
        match ring {
          PolygonRing::Outer(points) => {
            // 创建外环
            let coords = points
              .iter()
              .map(|p| geo_types::Coord { x: p.x, y: p.y })
              .collect();
            let exterior_ring = LineString::new(coords);
            exterior = Some(exterior_ring);
          }
          PolygonRing::Inner(points) => {
            // 创建内环
            let coords = points
              .iter()
              .map(|p| geo_types::Coord { x: p.x, y: p.y })
              .collect();
            interiors.push(LineString::new(coords));
          }
        };
      }

      // 验证外环是否存在
      match exterior {
        Some(ext) => wkt::ToWkt::to_wkt(&Polygon::new(ext, interiors)),
        None => return Err("Warning: Invalid polygon detected - missing outer ring".to_string()),
      }
    }
    _ => return Err("Expected Polygon shape".to_string()),
  };
  Ok(wkt_value)
}

fn process_line_wkt(shape: &Shape) -> Result<Wkt<f64>, String> {
  let wkt_value = match shape {
    Shape::Polyline(polyline) => {
      let points = polyline
        .parts()
        .iter()
        .flat_map(|part| {
          part.iter().map(|point| geo_types::Coord {
            x: point.x,
            y: point.y,
          })
        })
        .collect();
      let line = LineString::new(points);
      wkt::ToWkt::to_wkt(&line)
    }
    _ => return Err("Expected Polygon shape".to_string()),
  };

  Ok(wkt_value)
}

fn process_point_wkt(shape: &Shape) -> Result<Wkt<f64>, String> {
  let wkt_value = match shape {
    Shape::Point(point) => {
      let geo_point = Point::new(point.x, point.y);
      wkt::ToWkt::to_wkt(&geo_point)
    }
    _ => return Err("Expected Point shape".to_string()),
  };

  Ok(wkt_value)
}

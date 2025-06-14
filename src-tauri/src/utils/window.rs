use tauri::Manager;

pub fn init_window_config(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  log::info!("初始化 window 配置...");
  let window = app_handle.get_webview_window("main").unwrap();

  let js = format!(
    r#"
    console.log("初始化window配置...");
    sessionStorage.setItem('__BIZ_SCOPE__', JSON.stringify({{
        config: {{
          "SM_MAPBOX_TOKEN": "pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY20xdXM1OWQ5MDQ5MDJrb2U1cGcyazR6MiJ9.ZtSFvLFKtrwOt01u-COlYg",
          "SM_GEOVIS_TOKEN": "62d17dd1bcd9b6b4cde180133d80aa420446c9d132f88cb84c29d51e77d01c4c",
          "SM_TIANDITU_TOKEN": "211138deb6faa1f236b45eacd0fd331d",
        }},
    }}));
    console.log("初始化window配置成功");
    "#
  );

  match window.eval(&js) {
    Ok(_) => {
      log::info!("初始化 window 配置成功");
      Ok(())
    }
    Err(e) => {
      log::error!("初始化 window 配置失败: {}", e);
      Err(Box::new(e))
    }
  }
}

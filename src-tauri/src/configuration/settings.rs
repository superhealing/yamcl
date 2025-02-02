use std::fs;

use serde::{Deserialize, Serialize};

use crate::{minecraft::java::JavaDetails, get_config_dir};


const SETTINGS_FILE_NAME: &str = "settings.json";


#[derive(Debug, Deserialize, Serialize)]
pub struct AppSettings {
    pub instance_size: u16,
    pub instance_path: Option<String>,
    pub icon_path: Option<String>,
    pub java_settings: Vec<JavaDetails>
}

#[tauri::command]
pub fn get_settings() -> AppSettings {
    AppSettings::get()
}

#[tauri::command]
pub fn update_settings(new_settings: AppSettings) {
    new_settings.set()
}

impl AppSettings {
    pub fn get() -> Self {
        let defaults = AppSettings {
            instance_size: 16,
            instance_path: None,
            icon_path: None,
            java_settings: Vec::new(),
        };
        
        let path = get_config_dir().join(SETTINGS_FILE_NAME);
        if !path.is_file() {
            if let Some(parent) = path.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent).expect("Failed to create config directory!");
                }
            }
            fs::write(path, serde_json::to_string_pretty(&defaults).unwrap()).expect("Failed to write to settings file!");
            return defaults
        }

        let file = fs::read_to_string(path).expect("Failed to read settings file!");
        serde_json::from_str(&file).expect("Failed to parse settings!")
    }

    pub fn set(self) {
        let path = get_config_dir().join(SETTINGS_FILE_NAME);

        fs::write(path, serde_json::to_string_pretty(&self).unwrap()).expect("Failed to write to settings file!");
    }
}
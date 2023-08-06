use std::{fs::{self}, path::Path};

use tauri::{AppHandle, Manager};
mod instances;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_instances,
            unlock_icons
        ])
        .run(tauri::generate_context!())
        .expect("failed to run app");
        
}

#[tauri::command]
fn unlock_icons(path: String, app_handle: AppHandle) {
    app_handle.asset_protocol_scope().allow_directory(Path::new(&path), true).unwrap();
}

#[tauri::command(async)]
fn get_instances(path: String, app_handle: AppHandle) {
    let paths = fs::read_dir(path).unwrap();

    for path in paths {
        if path.as_ref().unwrap().file_type().unwrap().is_dir() {
            let instance_folder = path.unwrap();

            let instance_contents = fs::read_dir(instance_folder.path()).unwrap();

            for file in instance_contents {
                match file.unwrap().file_name().into_string().unwrap().as_ref() {
                    "minecraftinstance.json" => {instances::handle_instance_cf(instance_folder, app_handle.clone()); break;},
                    "instance.cfg" => {instances::handle_instance_mmc(instance_folder, app_handle.clone()); break;},
                    _ => continue
                }   
            }
        }
    }
}
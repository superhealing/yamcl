import { invoke } from "@tauri-apps/api";
import { open, confirm } from "@tauri-apps/api/dialog";
import { changeSetting, getSetting } from "./settings";
import { writable } from "svelte/store";
// @ts-ignore
import { minecraftVersionList } from "./versions";



/**
 * @type {import("svelte/store").Writable<{ path: string, label: string, version: string,  mcVersions: {min: typeof minecraftVersionList.versions[0], max: typeof minecraftVersionList.versions[0]}, xmx:number, xms: number, args: string, extended: boolean, mcExtended: boolean }[]>}
 */
export const javaStore = writable([])

/**
 * @type {{ path: string, label: string, version: string,  mcVersions: {min: typeof minecraftVersionList.versions[0], max: typeof minecraftVersionList.versions[0]}, xmx:number, xms: number, args: string, extended: boolean, mcExtended: boolean }[]}
 */
let javaSettings = []

export async function getJavaSettings() {
    javaSettings = await getSetting('javaSettings')
    javaStore.set(javaSettings)
}

export function saveJavaSettings() {
    /**
   * @type {{ path: string, label: string, version: string, mcVersions: {min: typeof minecraftVersionList.versions[0], max: typeof minecraftVersionList.versions[0]}, xmx:number, xms: number, args: string, }[]}
   */
    let _savedJavaSettings = []
    javaSettings.forEach(e => {
        const { path, label, version, mcVersions, args, xmx, xms } = e
        _savedJavaSettings.push({ path, label, version, mcVersions, args, xmx, xms })
    })
    changeSetting('javaSettings', _savedJavaSettings)
}

export function addJavaSetting() {
    javaSettings.push({
        // @ts-ignore
        path: 'Click to set!', label: 'New Java', mcVersions: {min:{},max:{}}, args: '', xmx: 4096, xms: 2048, extended: true, version: 'Select Java binary path!', mcExtended: false
    })
    javaStore.set(javaSettings)
}

/**
 * @param {number} index
 */
export async function deleteJavaSetting(index) {
    let confirmation = await confirm(
        `Are you sure you want to delete '${javaSettings[index].label}'?\nThis Action is irreversible, however you can re-add it at any time.`,
        { title: 'Confirm Deletion', type: 'warning'}
    )
    if(confirmation) {
        javaSettings.splice(index, index)
        javaStore.set(javaSettings)
        saveJavaSettings()
    }
}

/**
 * @param {number} index Index of the Java in javaSettings
 * @param {'min' | 'max'} minmax The Property in the javaSetting
 * @param {any} value The new value for the Property
 */
export function updateJavaMcVersions(index, minmax, value) {
    // @ts-ignore
    if(!javaSettings[index].mcVersions) javaSettings[index].mcVersions = {min: {}, max: {}}
    javaSettings[index].mcVersions[minmax] = value
    javaStore.set(javaSettings)
    saveJavaSettings()
}

/**
 * @param {number} index Index of the Java in javaSettings
 */
function getJavaArgs(index) {
    let j = javaSettings[index]
    return `-Xmx${j.xmx}M -Xms${j.xms}M ${j.args}`
}

/**
* @param {number} index Index of the Java in javaSettings
*/
export async function testJavaVersion(index) {
    await getJavaVersion(javaSettings[index].path, getJavaArgs(index))
        .then(v => { javaSettings[index].version = v; saveJavaSettings() })
        .catch(err => { console.error(err); javaSettings[index].version = 'Invalid Java!'})
    javaStore.set(javaSettings)
}

/**
* @param {string} path The Java binary path
* @param {string} args Args to run it with
* @returns {Promise<string>} The 'java --version' output if successful
*/
export async function getJavaVersion(path, args) {
    return new Promise((resolve, reject) => {
        invoke('get_java_version', { path, args })
            .then(res => {
                res = res.replaceAll('"','')
                res = res.replaceAll('\n',' ')
                let array = res.split(' ')
                resolve(`${array[2]}`)
            })
            .catch(_ => reject(`Failed to get java version for ${path}!`))
    })
}

/**
* @param {number} index Index of the Java in javaSettings
*/
export async function setJavaPath(index) {
    /**
     * @type String
    */
    //@ts-ignore
    let dir = await open({
        multiple: false
    })

    if(dir==null) return
    javaSettings[index].path = dir
    testJavaVersion(index)
}

const vscode = require("vscode");
const config = require("./config");
/**
 * @type {vscode.ExtensionContext}
 */
let content;

function init(_content) {
	content = _content;
}
/**
 * 设置存储数据
 * @param {String} key 键
 * @param {Object} value 默认值
 */
function setState(key, value) {
	content.globalState.update(key, value);
}
/**
 * 读取存储数据
 * @param {String} key 键
 * @param {Object} def 默认值
 */
function getState(key, def) {
	return content.globalState.get(key, def);
}
/**
 * 设置需要同步的值
 * @param  {...String} keys 
 */
function setSync(...keys){
	content.globalState.setKeysForSync(keys);
}

module.exports = {
	init,
	setState,
	getState,
	setSync
};

const vscode = require("vscode");

let config = {
	// production dev
	env: "dev",
};
module.exports = {
	...config,
	/**
	 * 获取vscode设置
	 * @param {String} key 
	 * @param {any} defaultValue 
	 */
	get(key, defaultValue=undefined) {
		let t = vscode.workspace.getConfiguration("novelLook");
		return t.get(key, defaultValue);
	},
	/**
	 * 设置vscode设置
	 * @param {*} key
	 * @param {*} value
	 */
	set(key, value) {
		let t = vscode.workspace.getConfiguration("novelLook");
		t.update(key, value, true);
	},
};

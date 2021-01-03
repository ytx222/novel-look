const file = require("./file/file");
const split = require("./split");
const vscode = require("vscode");
const { createTreeView, command: viewCommand } = require("./TreeViewProvider");
const { init:initUtil } = require("./util");
/**
 * @type {vscode.ExtensionContext}
 */
let content;

/**
 * 初始化
 * @param {vscode.ExtensionContext} _context vscode拓展上下文
 */
async function init(_context) {
	content = _context;
	// 工具类,优先初始化,其他地方很有可能用
	initUtil(content)
	let fileList = await file.init(content);
	createTreeView(fileList, content);
	// 这个数据是否需要被当前用户的其他设备同步
	// content.globalState.setKeysForSync(["configuration", "extensions",""]);
}

// 输出一条helloWord
function helloWorld() {
	vscode.window.showInformationMessage("Hello World from novel-look!");
	console.log("helloWord执行------");
}
// 输出sayHello
function sayHello() {
	console.log("sayHello");
	vscode.window.showInformationMessage("sayHello");

	vscode.commands.getCommands().then(allCommands => {
		console.log("所有命令：", allCommands);
	});
}
/**
 * 获取拓展上下文
 * @return {vscode.ExtensionContext}
 */
function getContent() {
	return content;
}
module.exports = {
	command: {
		helloWorld,
		sayHello,
		...file.command,
		...viewCommand,
	},
	init: init,
	getContent,
};


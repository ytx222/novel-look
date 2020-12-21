// vscode模块包含VS Code可扩展性API
// 导入模块并在下面的代码中使用别名vscode引用它
const vscode = require("vscode");
// 方法在index.js,导入,并集中添加
const index = require("./index");

// 此方法在您的扩展被激活时被调用
// 您的扩展是激活的第一次命令被执行

/**
 * 拓展激活的事件,激活拓展时执行,拓展激活事件只会执行一次
 * @param {vscode.ExtensionContext} context vscode拓展上下文
 */
async function activate(context) {
	console.log("\n\n拓展激活成功============================================================");
	// vscode.window.setStatusBarMessage('你好，前端艺术家！');

	// console.log(context.globalState);
	// console.log(context.globalStoragePath);
	// console.log(context.globalStorageUri);
	// 初始化自己的文件夹
	// C:\Users\Administrator\AppData\Roaming\Code\User\globalStorage\ytx.novel-look
	// let uri = context.globalStorageUri;
	// let fs = vscode.workspace.fs;
	// let t=fs.createDirectory(uri).then(function (e,e2) {
	// 	console.warn("createDirectory");
	// 	console.warn(e,e2);
	// 	console.warn(t);
	// })
	index.init(context)
	// 注册命令
	let command = index.command;
	for (var item in command) {
		context.subscriptions.push(vscode.commands.registerCommand("novel-look." + item, command[item]));
	}
	// vscode.window.
	// 测试专用命令

	context.subscriptions.push(
		vscode.commands.registerCommand("novel-look.test", function () {
			vscode.window.showInformationMessage("test");
			// vscode.commands.getCommands().then(allCommands => {
			// 	console.log("所有命令：", allCommands);
			// });
		})
	);
	// console.log("执行完成");
}
// exports.activate = activate;

// 当你的扩展被停用时，这个方法被调用
function deactivate() {
	vscode.window.showInformationMessage("拓展被停用");
}

function getCurrentFilePath() {}
function testMenuShow() {}
function openWebview() {}
function sayHello() {}

module.exports = {
	activate,
	deactivate,
	demo: {
		getCurrentFilePath,
		testMenuShow,
		openWebview,
		sayHello,
	},
};
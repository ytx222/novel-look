const vscode = require("vscode");
const file = require("./file/file");
const { Bookrack } = require("./TreeViewProvider");
const path = require("path");

/**
 * @type {vscode.WebviewPanel}
 */
let webView;
/**
 * 创建
 */
async function createWebView() {
	const index = require("./index");
	const context = index.getContent();
	webView = vscode.window.createWebviewPanel(
		"novel", // 标识webview的类型。在内部使用
		"阅读", // 标题
		vscode.ViewColumn.One, // 编辑器列以显示新的webview面板。
		{
			// 可以加载资源的路径
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "src"))],
			// 启用javascript
			enableScripts: true,
			// 查找
			enableFindWidget: true,
		} // Webview选项。稍后将详细介绍这些内容。
	);
	// And set its HTML content
	webView.webview.html = await getWebviewContent();
	// panel.onDidDispose(
	//     () => {
	//       // When the panel is closed, cancel any future updates to the webview content
	//       clearInterval(interval);
	//     },
	//     null,
	//     context.subscriptions
	//   );
	// 关闭事件
	webView.onDidDispose(
		() => {
			// 执行0.0
			webView = null;
			console.log("已关闭webView");
		},
		null,
		context.subscriptions
	);
	// 消息事件
	webView.webview.onDidReceiveMessage(
		message => {
			console.warn("message:  ", message);
		},
		undefined,
		context.subscriptions
	);
	// console.warn(webView.visible);
	// setTimeout(() => {
	// 	// webView.dispose();
	// 	webView.reveal();
	// }, 2000);
}

/**
 * 获取webView的内容
 * @return {Promise<String>}
 */
async function getWebviewContent() {
	let s = "";
	// 读取文件,显示
	s = await file.getWebViewHtml();
	return s;
}

/**
 * 显示某一章
 */
async function showChapter(title, list) {
	if (!webView) {
		await createWebView();
	}
	await postMsg("showChapter", { title, list });
}
/**
 * 发送消息
 * @param {String} type 操作类型  showChapter
 * @param {Object} data  数据
 */
async function postMsg(type, data) {
	await webView.webview.postMessage({ type, data });
}

module.exports = {
	createWebView,
	showChapter,
};

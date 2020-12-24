const vscode = require("vscode");
const { Bookrack } = require("./TreeViewProvider");
/**
 * @type {vscode.WebviewPanel}
 */
let webView;
/**
 * 创建
 */
async function createWebView() {
	webView = vscode.window.createWebviewPanel(
		"catCoding", // 标识webview的类型。在内部使用
		"阅读", // 标题
		vscode.ViewColumn.One, // 编辑器列以显示新的webview面板。
		{} // Webview选项。稍后将详细介绍这些内容。
	);
	// And set its HTML content
	webView.webview.html = await getWebviewContent();
}
/**
 * 获取webView的内容
 * @return {Promise<String>}
 */
async function getWebviewContent() {
	let s = "";
	// 读取文件,显示
	return s;
}
/**
 * 显示某一章
 */
async function showChapter() {
	if (!webView) {
		await createWebView();
	}
}

module.exports = {
	createWebView,
	showChapter,
};

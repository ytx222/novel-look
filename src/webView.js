const vscode = require("vscode");
const file = require("./file/file");

const path = require("path");
const config = require("./config");

/**
 * @type {vscode.ExtensionContext}
 */
let content;
/**
 * webview页面
 * @type {vscode.WebviewPanel}
 */
let panel;
/**
 * 创建
 */
async function createWebView() {
	const index = require("./index");
	content = index.getContent();
	// 存储panel相关文件的目录
	let url = path.join(content.globalStorageUri.fsPath, "static");
	panel = vscode.window.createWebviewPanel(
		"novel", // 标识webview的类型。在内部使用
		"阅读", // 标题
		vscode.ViewColumn.One, // 编辑器列以显示新的webview面板。
		{
			// enableCommandUris: true,
			// // 可以加载资源的路径
			// // localResourceRoots: [vscode.Uri.file(url),uri],
			localResourceRoots: [vscode.Uri.file(url)],
			// // 启用javascript
			enableScripts: true,
			// // 查找
			enableFindWidget: true,
			// 关闭时保留上下文,我这个当然不需要
			// retainContextWhenHidden: true,
		}
	);
	let webview = panel.webview;
	webview.html = await getWebviewContent(url);
	// 关闭事件
	panel.onDidDispose(onDidDispose, null, content.subscriptions);
	// 消息事件
	webview.onDidReceiveMessage(onMessage, null, content.subscriptions);
	// 初始化完成后,设置style
	setting();
}
// 初始化样式设置
function setting() {
	let t = config.readSetting;
	t.zoom = content.globalState.get("zoom", t.zoom);
	postMsg("setting", t);
}

/**
 * 获取panel的内容
 * @return {Promise<String>}
 */
async function getWebviewContent(url) {
	let s = "";
	// 读取文件,显示
	s = await file.getWebViewHtml();
	// 替换某些特定的值(路径)
	// @ts-ignore
	let result = s.replace(/(@)(.+?)/g, (_m, _$1, $2) => {
		return panel.webview.asWebviewUri(vscode.Uri.file(path.join(url, $2)));
	});
	return result;
}

/**
 * 显示某一章
 */
async function showChapter(title, list) {
	if (!panel) {
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
	await panel.webview.postMessage({ type, data });
}
/**************************************
			接收消息,以及处理
***************************************/
async function onDidDispose(e) {
	// 执行0.0
	panel = null;
	console.log("已关闭panel");
}
/**
 * 对于webView消息的响应函数
 */
let fn = {
	chapterToggle(type) {
		const provider = require("./TreeViewProvider");
		try {
			provider[type + "Chapter"]();
		} catch (error) {
			console.error(error);
			console.log(type + "Chapter");
			console.log(provider);
			console.log(provider[type + "Chapter"]);
			vscode.window.showInformationMessage(`切换章节操作${type}不存在`);
		}
	},
	zoom(v) {
		
		content.globalState.update("zoom", v);
		// config.readSetting.zoom = v;// 
	},
};
async function onMessage(e) {
	console.warn("message:  ", e);
	fn[e.type](e.data);
}
async function closeWebView() {
	if (panel) {
		panel.dispose();
		panel = null;
	}
}
module.exports = {
	createWebView,
	showChapter,
	closeWebView,
};

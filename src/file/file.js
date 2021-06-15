const path = require("path");
const vscode = require("vscode");
const util = require("./fileUtil");
const config = require("../config");
/**
 * @type {vscode.Uri}
 */
let uri;
/**
 * @type {vscode.FileSystem}
 */
let _fs;
/**
 * @type {vscode.ExtensionContext}
 */
let context;
/**
 * 初始化
 * @param {vscode.ExtensionContext} _context vscode拓展上下文
 * @return {Promise<String[]>}
 */
async function init(_context) {
	// console.warn("init----file");
	// 初始化变量
	context = context || _context;
	uri = uri || context.globalStorageUri;
	_fs = _fs || vscode.workspace.fs;
	// 先创建一遍,如果已存在,不会做操作
	await _fs.createDirectory(uri);
	return await getBookList();
}

async function getBookList() {
	return await util.readDir(uri.fsPath, true);
}

async function openChapter(_path, fileName, content) {
	await openTextDocument(_path, fileName + ".vscode-novel", content, true, true);
}
async function openTextDocument(_path, fileName, content, isFromUri = false, isCreateDir = false) {
	let fileUri = vscode.Uri.joinPath(isFromUri ? uri : null, _path, fileName);
	// 创建文件
	await util.writeFile(fileUri.fsPath, content, isCreateDir);
	// 创建文档
	let doc = await vscode.workspace.openTextDocument(fileUri);
	// 打开文档
	await vscode.window.showTextDocument(doc, { preview: false });
}

async function getWebViewHtml() {
	let dirSrc = path.join(uri.fsPath, "/static/");
	// 测试环境的话,不使用拓展工作路径的
	console.warn("isDev:",config.env);
	if (config.env === "dev") {
		await copyDir(path.join(context.extensionUri.fsPath, "/src/static/"), dirSrc);
		return await util.readFile(dirSrc + "webView.html");
	}
	try {
		return await util.readFile(dirSrc + "webView.html");
	} catch (error) {
		await copyDir(path.join(context.extensionUri.fsPath, "/src/static/"), dirSrc);
		return await util.readFile(dirSrc + "webView.html");
	}
}

async function copyDir(src, dist) {
	// 复制文件夹的逻辑
	let files = await util.readDir(src);
	// 这里文件不多,没有必要用多进程同步进行,for循环单进程读写文件即可
	for (var i = 0; i < files.length; i++) {
		let toFileUrl = path.join(dist, path.basename(files[i]));
		let s = await util.readFile(files[i]);
		await util.writeFile(toFileUrl, s, true);
	}
}
/**
 * 打开资源管理器
 * @param {*} url
 */
function openExplorer(url = uri.fsPath) {
	var exec = require("child_process").exec;
	exec('explorer.exe /e,"' + url + '"');
}

/**
 * 打开资源管理器
 */
function openWebViewDir() {
	let url = path.join(uri.fsPath, "/static/");
	var exec = require("child_process").exec;
	exec('explorer.exe /e,"' + url + '"');
}

/**
 * file不提供工具方法,只提供和文件相关的,工具方法的封装调用
 */
module.exports = {
	command: {
		openWebViewDir,
		openExplorer,
	},
	getUrl() {
		return uri;
	},
	getBookList,
	readFile: util.readFile,
	init,
	openChapter,
	getWebViewHtml,
};

const fs = require("fs");
const path = require("path");
const { env, openDirReadme, openDirFileName } = require("../config");
const vscode = require("vscode");
const util = require("./fileUtil");
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
	context = _context;
	uri = context.globalStorageUri;
	_fs = vscode.workspace.fs;
	// 先创建一遍,如果已存在,不会做操作
	await _fs.createDirectory(uri);
	// console.log(typeof uri);
	return util.readDir(uri.fsPath, true);
}

/**
 * 打开本地拓展文件路径(Uri)
 */
async function openUri() {
	await openTextDocument("", openDirFileName, openDirReadme + uri.fsPath, true);
}
async function openChapter(_path, fileName, content) {
	await openTextDocument(_path, fileName + ".vscode-novel", content, true);
}
async function openTextDocument(_path, fileName, content, isFromUri = false) {
	let fileUri = vscode.Uri.joinPath(isFromUri ? uri : null, _path, fileName);
	// 创建文件
	await util.writeFile(fileUri.fsPath, content, false);
	// 创建文档
	let doc = await vscode.workspace.openTextDocument(fileUri);
	// 打开文档
	await vscode.window.showTextDocument(doc, { preview: false });
}

async function getWebViewHtml() {
	let dirSrc = path.join(uri.fsPath, "/static/");
	// 测试环境的话,不使用拓展工作路径的
	if (env === "dev") {
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
	// let src = path.join(context.extensionUri.fsPath, "/src/static/");
	// 复制文件夹的逻辑
	let files = await util.readDir(src);
	// 这里文件不多,没有必要用多进程同步进行,for循环单进程读写文件即可
	for (var i = 0; i < files.length; i++) {
		let toFileUrl = path.join(dist, path.basename(files[i]));
		// fs.createReadStream(files[i]).pipe(fs.createWriteStream(toFileUrl));
		// console.warn(toFileUrl);
		let s = await util.readFile(files[i]);
		await util.writeFile(toFileUrl, s, true);
	}
	// util.createDir(dirSrc,true)
}
/**
 * 打开资源管理器
 * @param {*} url
 */
function openExplorer(url = uri.fsPath) {
	var exec = require("child_process").exec;
	exec('explorer.exe /e,"' + url + '"');
}

// copy("./static/img", "./myNewImg");
/**
 * file不提供工具方法,只提供和文件相关的,工具方法的封装调用
 */
module.exports = {
	command: {
		openUri,
		openExplorer,
	},
	// uri,
	// _fs,
	// context,
	getUrl () { return uri },
	
	readFile: util.readFile,
	init,
	openChapter,
	getWebViewHtml,
};

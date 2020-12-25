const fs = require("fs");
const path = require("path");
const { match, ignoreDir, ignoreFileName, openDirReadme, openDirFileName } = require("../config");
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
	console.warn("init----file");
	// 初始化变量
	context = _context;
	uri = context.globalStorageUri;
	_fs = vscode.workspace.fs;
	// 先创建一遍,如果已存在,不会做操作
	await _fs.createDirectory(uri);
	// console.log(typeof uri);
	return util.readDir(uri.fsPath);
}

/**
 * 打开本地拓展文件路径(Uri)
 */
async function openUri() {
	let fileUri = vscode.Uri.joinPath(uri, openDirFileName);
	// 创建文件
	await util.writeFile(fileUri.fsPath, openDirReadme + uri.path, false);
	// 创建文档
	let doc = await vscode.workspace.openTextDocument(fileUri);
	// 打开文档
	await vscode.window.showTextDocument(doc, { preview: false });
}
async function openChapter(_path, fileName, content) {
	let fileUri = vscode.Uri.joinPath(uri, _path, fileName + ".vscode-novel");
	fs.writeFile(fileUri.fsPath, content, async function (err) {
		if (err) {
			// 如果是没有文件夹错误,则创建
			if (err.code === "ENOENT") {
				await createChapterDir(path.join(uri.fsPath, _path), fileName);
				return;
			}
			vscode.window.showInformationMessage("打开失败,无文件权限?");
			return;
		}
		// 打开未命名文档
		//  function openTextDocument(options?: { language?: string; content?: string; }):
		let doc = await vscode.workspace.openTextDocument(fileUri);
		await vscode.window.showTextDocument(doc, { preview: false });
	});
}
function createChapterDir(path, fileName, content) {
	return new Promise((resolve, reject) => {
		fs.mkdir(path, { recursive: true }, function (err) {
			if (err) {
				vscode.window.showInformationMessage("打开失败,无文件权限?");
			} else {
				openChapter(path, fileName, content).then(function () {
					resolve();
				});
			}
			// console.warn(err);
		});
	});
}

function readFile(url) {
	return new Promise(function (resolve, reject) {
		//{ encoding: "gb2312" },
		console.warn(Date.now());

		fs.readFile(url, function (err, data) {
			console.warn(Date.now());

			// console.warn("readFile", err, data);
			if (err) {
				reject(err);
				return;
				// resolve(""); //也可以返回空字符串?
			}
			resolve(data.toString());
			console.warn(Date.now());
		});
	});
}
function getWebViewHtml() {
	return new Promise((resolve, reject) => {
		let dirSrc = path.join(uri.fsPath, "/static/");
		fs.readFile(dirSrc + "webView.html", async function (err, data) {
			if (err) {
				// 如果是没有文件夹错误,则创建
				if (err.code === "ENOENT") {
					resolve(await initWebViewFile(dirSrc));
				} else {
					vscode.window.showInformationMessage("打开失败,");
				}
				resolve("");
				return;
			}
			console.log(data.toString());
			resolve(data.toString());
		});
	});
}

function initWebViewFile(dist) {
	let src = path.join(context.extensionUri.fsPath, "/src/static/");
	return new Promise(async (resolve, reject) => {
		const { createDocs } = require("../copyFile");
		createDocs(src, dist, async function () {
			resolve(await getWebViewHtml());
		});
	});
}

// copy("./static/img", "./myNewImg");
/**
 * file不提供工具方法,只提供和文件相关的,工具方法的封装调用
 */
module.exports = {
	command: {
		openUri,
		openExplorer: util.openExplorer,
	},
	uri,
	_fs,
	context,
	readFile,
	init,
	openChapter,
	getWebViewHtml,
};

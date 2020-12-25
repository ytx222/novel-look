const fs = require("fs");
const path = require("path");
const { match, ignoreDir, ignoreFileName, openDirReadme, openDirFileName } = require("../config");
const vscode = require("vscode");
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
	return readDir(uri.fsPath);
}

/**
 * 获取一个目录下的所有可能的电子书文件(*.txt)
 * @param {String} url
 * @return {Promise<String[]>} 地址列表
 */
async function readDir(url) {
	return new Promise(async function (resolve, reject) {
		try {
			const dir = await getDir(url);
			let t;
			let arr = [];
			// 读取文件夹下的所有 目录项
			while ((t = await dir.read())) {
				//如果是文件夹,
				if (t.isDirectory()) {
					if (!ignoreDir.includes(t.name)) {
						// 将递归读取的结果,直接添加进数组中
						arr.push(...(await readDir(path.resolve(url, t.name))));
					}
				}
				// 如果是文件,并且名称是合法名称
				if (t.isFile() && match.novelName.test(t.name) && !ignoreFileName.includes(t.name)) {
					arr.push(path.resolve(url, t.name));
				}
			}
			dir.close();
			resolve(arr);
		} catch (err) {
			reject(err);
		}
	});
}
/**
 * 打开文件夹,获取dir对象
 * @param {*} url String
 * @return {Promise<fs.Dir>}
 */
function getDir(url) {
	return new Promise((resolve, reject) => {
		try {
			fs.opendir(url, (err, dir) => {
				if (err) {
					reject(err);
				}
				resolve(dir);
			});
		} catch (error) {
			console.error("读取文件夹失败");
			reject(error);
		}
	});
}

function openExplorer(url = uri.fsPath) {
	var exec = require("child_process").exec;
	console.log(url);
	exec('explorer.exe /e,"' + url + '"');
}
/**
 * 打开本地拓展文件路径(Uri)
 */
async function openUri() {
	let fileUri = vscode.Uri.joinPath(uri, openDirFileName);
	fs.writeFile(fileUri.fsPath, openDirReadme + uri.path, async function (err) {
		if (err) {
			vscode.window.showInformationMessage("打开失败,无文件权限?");
		}
		// 打开未命名文档
		//  function openTextDocument(options?: { language?: string; content?: string; }):
		let doc = await vscode.workspace.openTextDocument(fileUri);
		await vscode.window.showTextDocument(doc, { preview: false });
	});
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
module.exports = {
	command: {
		openUri,
		openExplorer,
	},
	readDir,
	readFile,
	init,
	openChapter,
	getWebViewHtml,
};

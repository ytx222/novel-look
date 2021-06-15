const fs = require("fs");
const path = require("path");
const config = require("./../config");
const vscode = require("vscode");
const file = require("./file");
// 没啥好名字
const encoding = require('./encoding/index');

/**
 * 获取一个目录下的所有可能的电子书文件(*.txt)
 * @param {String} url
 * @return {Promise<String[]>} 地址列表
 */
async function readDir (url, isFilter) {
	let ignoreDir = config.get("ignoreDir", [])
	let ignoreFileName = config.get("ignoreFileName", [])
	let novelName = new RegExp(config.get("match.novelName"))
	return new Promise(async function (resolve, reject) {
		try {
			const dir = await getDir(url);
			let t;
			let arr = [];
			// 读取文件夹下的所有 目录项
			while ((t = await dir.read())) {
				//如果是文件夹,
				if (t.isDirectory()) {
					// 如果不过滤 或者过滤并且满足条件
					if (!isFilter || !ignoreDir.includes(t.name)) {
						// 将递归读取的结果,直接添加进数组中 递归的同时吧是否过滤也传递
						arr.push(...(await readDir(path.resolve(url, t.name), isFilter)));
					}
				}
				// 如果不过滤 或者过滤并且满足条件
				// 如果是文件,并且名称是合法名称
				// console.warn(t.name, !isFilter, t.isFile() && match.novelName.test(t.name) && !ignoreFileName.includes(t.name));
				if (!isFilter || (t.isFile() && novelName.test(t.name) && !ignoreFileName.includes(t.name))) {
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
/**
 * 读取文件
 * @param {String} url 地址
 * @param {Boolean} checkEncoding 是否需要检查编码
 */
function readFile(url, checkEncoding = false) {
	return new Promise(function (resolve, reject) {
		//{ encoding: "gb2312" },
		fs.readFile(url, function (err, buffer) {
			if (err) {
				reject(err);
				return;
			}
			if (checkEncoding) {
				resolve(encoding(buffer))
			} else {
				resolve(buffer.toString());
			}
		});
		// 判断编码
		// fs.readFile(url, function (err, buffer) {
		// 	let encoding
		// 	if (buffer[0] == 0xff && buffer[1] == 0xfe) {
		// 		encoding="ucs2"//unicode
		// 	} else if (buffer[0] == 0xfe && buffer[1] == 0xff) {
		// 		encoding="ucs2"//unicode
		// 	} else if (buffer[0] == 0xef && buffer[1] == 0xbb) {
		// 		encoding="utf8"
		// 	} else {
		// 		// 都不是,则按照gbk
		// 		// gb2312
		// 		encoding="ucs-2"
		// 	}
		// 	let t=buffer.toString(encoding)
		// 	console.log(t.substr(0,100));
		// });
		// const chardet = require("chardet");

		// chardet.detect(Buffer.from("hello there!"));
		// // or
		// chardet.detectFile(url).then(encoding => console.log(encoding));
		// // or
		// chardet.detectFileSync("/path/to/file");
	});
}
function writeFile(_path, content, isCreateDir = false) {
	return new Promise((resolve, reject) => {
		fs.writeFile(_path, content, async function (err) {
			if (err) {
				console.warn(isCreateDir, err.code === "ENOENT");
				if (isCreateDir && err.code === "ENOENT") {
					await createDir(path.dirname(_path), true);
					// 返回重新调用自身的结果(但是不强制创建文件夹了)
					resolve(await writeFile(_path, content));
				} else {
					reject(err);
				}
			} else {
				resolve();
			}
		});
	});
}
/**
 *
 * @param {String} path
 * @param {Boolean} recursive
 */
function createDir(path, recursive) {
	return new Promise((resolve, reject) => {
		fs.mkdir(path, { recursive }, function (err) {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

/**
 * 打开本地拓展文件路径(Uri)
 */
// async function openUri() {
// 	let fileUri = vscode.Uri.joinPath(file.uri, openDirFileName);
// 	fs.writeFile(fileUri.fsPath, openDirReadme + file.uri.path, async function (err) {
// 		if (err) {
// 			vscode.window.showInformationMessage("打开失败,无文件权限?");
// 		}
// 		// 打开未命名文档
// 		//  function openTextDocument(options?: { language?: string; content?: string; }):
// 		let doc = await vscode.workspace.openTextDocument(fileUri);
// 		await vscode.window.showTextDocument(doc, { preview: false });
// 	});
// }
async function openChapter(_path, fileName, content) {
	let fileUri = vscode.Uri.joinPath(file.uri, _path, fileName + ".vscode-novel");
	fs.writeFile(fileUri.fsPath, content, async function (err) {
		if (err) {
			// 如果是没有文件夹错误,则创建
			if (err.code === "ENOENT") {
				// await createChapterDir(path.join(file.uri.fsPath, _path), fileName);
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

/**
 * 提交关于操作文件的,可复用的代码
 */
module.exports = {
	readDir,
	getDir,
	readFile,
	writeFile,
	createDir,
};

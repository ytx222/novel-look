const fs = require("fs");
const path = require("path");
const { match } = require("./config");
/**
 * 获取一个目录下的所有可能的电子书文件(*.txt)
 * @param {String} url
 * @return {Array<String>} 地址列表
 */
async function readDir(url) {
	return new Promise(async function (resolve, reject) {
		try {
			const dir = await openDir(url);
			let t;
			let arr = [];
			// 读取文件夹下的所有 目录项
			while ((t = await dir.read())) {
				//如果是文件夹,
				if (t.isDirectory()) {
					// 将递归读取的结果,直接添加进数组中
					arr.push(...(await readDir(path.resolve(url, t.name))));
				}
				// 如果是文件,并且名称是合法名称
				if (t.isFile() && match.novelName.test(t.name)) {
					arr.push(path.resolve(url, t.name));
				}
			}
			resolve(arr);
		} catch (err) {
			reject(err);
		}
	});
}
/**
 * 打开文件夹,获取dir对象
 * @param {*} url String
 * @return {Dir}
 */
function openDir(url) {
	return new Promise((resolve, reject) => {
		try {
			let t = fs.opendir(url, (err, dir) => {
				if (err) {
					reject(err);
				}
				resolve(dir);
			});
			// console.log(t);
		} catch (error) {
			console.error("读取文件夹失败");
			reject(error);
		}
	});
}

function readFile(url) {
	return new Promise(function (resolve, reject) {
		//{ encoding: "gb2312" },
		fs.readFile(url,  function (err, data) {
			if (err) {
				reject(err);
				// resolve(""); //也可以返回空字符串?
			}
			resolve(data.toString());
		});
	});
}

module.exports = {
	readDir,
	readFile,
};

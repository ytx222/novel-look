const file = require("./file");
const split = require("./split");
const Novel = require("./Novel");
const vscode = require("vscode");
const { Bookrack, command: viewCommand } = require("./TreeViewProvider");
/**
 * @type {vscode.ExtensionContext}
 */
let content;

(function () {
	// 解决vscode调试输出函数null
	let l = console.log;
	console.log = function (...parms) {
		if (Object.prototype.toString.call(parms[0]).indexOf("Function") !== -1) {
			// console.dir(...parms);
			l("函数" + parms[0].name, { ...parms[0] }, parms[0].prototype);
		} else {
			l(...parms);
		}
	};
	l("替换console.log完成");
})();
/**
 * 初始化
 * @param {vscode.ExtensionContext} _context vscode拓展上下文
 */
async function init(_context) {
	console.log("init--index");
	content = _context;
	let t = await refreshFile(true);
	// vscode.window.registerTreeDataProvider("novel-look-book", new Bookrack(t));
	vscode.window.createTreeView("novel-look-book", {
		// @ts-ignore
		treeDataProvider: new Bookrack(t),
	});
}

async function refreshFile(isNotMsg) {
	let list = await file.init(content);
	// console.log(list);
	if (!isNotMsg) {
		vscode.window.showInformationMessage("刷新完成");
	}
	return list;
}
// 输出一条helloWord
function helloWorld() {
	vscode.window.showInformationMessage("Hello World from novel-look!");
	console.log("helloWord执行------");
}
// 输出sayHello
function sayHello() {
	console.log("sayHello");
	vscode.window.showInformationMessage("sayHello");

	vscode.commands.getCommands().then(allCommands => {
		console.log("所有命令：", allCommands);
	});
}
// function sayHello(){ }

module.exports = {
	command: {
		refreshFile,
		helloWorld,
		sayHello,
		...file.command,
		...viewCommand,
	},
	init: init,
};

// readFile
// 	.readDir("./")
// 	.then(function (e) {
// 		console.log(e);
// 	})
// 	.catch(function (err) {
// 		console.error(err);
// 	});

// .then(function (e) {
// 	console.log(e && e.length);
// })
// .catch(function (err) {
// 	console.error(err);
// });

// async function open() {
// 	try {
// 		let s = await readFile.readFile("./神工.txt");
// 		// console.log(s.length);
// 		split.split(s);
// 	} catch (error) {
// 		// console.log(error);
// 	}
// }
// console.time();
// console.log(Date.now());
// open();
// console.timeEnd();

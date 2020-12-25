const path = require("path");
const vscode = require("vscode");
const file = require("./file/file");
const split = require("./split");
const config = require("./config");
const webView = require("./webView");

// extends vscode.TreeDataProvider
exports.Bookrack = class Bookrack {
	/**
	 * @param {any} arr
	 */
	constructor(arr) {
		this.list = this.parseArr(arr);
		// console.warn("创建书架--", arr);
	}
	/**
	 * @param {string | any[]} arr
	 */
	parseArr(arr) {
		const res = [];
		for (var i = 0; i < arr.length; i++) {
			let t = path.parse(arr[i]);
			// 0不可折叠 	1折叠 	2展开
			res[i] = new Book(t.name, i, arr[i], t.base);
		}
		return res;
	}

	/**
	 * 实现这个来返回在视图中显示的元素的UI表示形式(TreeItem)。
	 * @param {Book} element
	 * @return {vscode.TreeItem}
	 */
	getTreeItem(element) {
		// console.log("getTreeItem", element);
		// console.log(Object.prototype.toString.call(element));
		return element;
	}
	/**
	 * 实现这个以返回给定元素或根的子元素(如果没有传递元素)。
	 * @param {Book} element 应该是一个书对象
	 * @return {Promise<vscode.TreeItem[]>} 字类型(章节)数组
	 * return {Thenable<vscode.TreeItem[]>} 字类型(章节)数组
	 * 这两个应该是兼容的,
	 */
	async getChildren(element) {
		if (!this.list.length) {
			// console.log("getChildren", this.list, element);
			vscode.window.showInformationMessage("getChildren--list为空");
			return Promise.resolve([]);
		}
		// 返回根元素的子元素(书)
		if (!element) {
			return Promise.resolve(this.list);
		} else {
			// 返回某个元素的子元素,在这里必定的书的子元素,章节
			vscode.window.showInformationMessage("getChildren--获取章节");
			// console.log(element);
			let t = await element.getChapterList();
			return Promise.resolve(t);
		}
	}
};
/**
 * 书
 */
class Book extends vscode.TreeItem {
	/**
	 * 创建一本书
	 * @param {String} label 名称
	 * @param {Number} i 数组中的下标
	 * @param {String} fullPath 这本书的路径
	 * @param {String} base 文件名
	 */
	constructor(label, i, fullPath, base) {
		super(label);
		this.tooltip = `${this.label}---${"共0章"}`;
		this.collapsibleState = 1; // 可展开,未展开
		// this.description = this.version;
		this.iconPath = path.join(__filename, "..", "img", "book.svg");
		// 自己用的
		this.i = i;
		this.fullPath = fullPath;
		this.base = base;
		this.txt = ""; //文件内容,暂时留空
		this.chapterList = []; //章节列表,暂时留空
		this.timer = null;
	}
	async getChapterList() {
		await this.getContent();
		let arr = split.split(this.txt);
		this.chapterList = [];
		for (var i = 0; i < arr.length; i++) {
			let t = arr[i];
			this.chapterList.push(new Chapter(this, t.s, t.i, t.txtIndex, t.size));
		}
		return this.chapterList;
	}
	//
	/**
	 * 获取这本书的内容,为了节省内存,设置计时器在多少时间后删除文本(自动回收)
	 * 重复调用这个方法可以重置这个时间
	 */
	async getContent() {
		try {
			clearInterval(this.timer);
			//10分钟后清除这本书
			this.timer = setTimeout(() => {
				this.clearTxt();
			}, 1000 * 60 * 10);
			if (this.txt) {
				return;
			}
			this.txt = await file.readFile(this.fullPath);
		} catch (error) {
			console.error(error);
			vscode.window.showInformationMessage("获取书内容失败,错误信息已打印到控制台");
		}
	}

	// iconPath = {
	// 	light: ,
	// 	dark: path.join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
	// };
}
Book.prototype.clearTxt = function () {
	console.error("清除txt", this.label);
	this.txt = "";
};
/**
 * 章节
 */
class Chapter extends vscode.TreeItem {
	/**
	 * 创建章节
	 * @param {Book} book 这个章节属于哪本书
	 * @param {string} label 章节标题
	 * @param {Number} i 数组index
	 * @param {Number} txtIndex 在这本书的内容的开始下标
	 * @param {Number} size 长度
	 */
	constructor(book, label, i, txtIndex, size) {
		super(label.trim());
		this.tooltip = `${this.label}---共${size}字`;
		this.collapsibleState = 0; // 不可折叠
		// 4个自己用的
		this.title = label;
		this.i = i;
		this.txtIndex = txtIndex;
		this.size = size;
		this.book = book;
		this.command = { title: "", command: "novel-look.showChapter", arguments: [this] }; // 执行命令
		this.content = "";
	}
	/**
	 * 打开本章
	 *
	 */
	async openThis() {
		// console.log(this.i, this.txtIndex, this.size);
		await this.getTxt();
		// console.log(this.content.length);
		if (config.mode === "file") {
			this.parseChapterTxt_File();
			await file.openChapter("tmp/神工/", this.label, this.content);
		} else if (config.mode === "webView") {
			let lineList = this.parseChapterTxt_WebView();
			webView.showChapter();
		}
	}
	/**
	 * 处理章节的内容
	 * lineEnd其实再循环一遍追加可能更合适,但是我这里追求性能,所以直接写一起
	 * 对于<<<<<<<<<<开始结束标记,不添加indent
	 * 对>>>>>>>>>>添加额外的解释标记没有意义
	 */
	parseChapterTxt_File() {
		let arr = this.content.split("\n");
		let lineStart = "".padEnd(config.readSetting.lineIndent, " ");
		let lineEnd = "".padEnd(config.readSetting.lineSpace, "\n");
		let s = `<${this.label}>${lineEnd}\n<<<<<<<<<<${lineEnd}`;
		arr.forEach(function (item) {
			item = item.trim();
			if (item) {
				// res.push(lineStart+item + lineEnd);
				s += lineStart + item + lineEnd;
			}
		});
		this.content = s + `>>>>>>>>>>`;
	}
	/**
	 * 处理章节的内容,对于webView,不需要太多处理,给他数组就行,剩下的用css解决
	 */
	parseChapterTxt_WebView() {
		let arr = this.content.split("\n");
		let res = [];
		arr.forEach(function (item) {
			item = item.trim();
			if (item) {
				res.push(item);
			}
		});
		// console.warn(res);
		this.content = res.join("\n");
	}
	async getTxt() {
		await this.book.getContent();
		this.content = this.book.txt.substring(this.txtIndex + this.title.length, this.txtIndex + this.size);
	}
}
exports.command = {};

exports.command.showChapter = async function (e) {
	// console.warn("exports.command.showChapter", e);
	//是对章执行的命令
	if (e && e instanceof Chapter) {
		// console.log("showChapter---执行");
		// 打开章节
		e.openThis();
	} else if (e && e instanceof Book) {
		// 只有这个不生效
		e.collapsibleState = 2;
	}
};

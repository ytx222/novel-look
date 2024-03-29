const path = require("path");
const vscode = require("vscode");
const file = require("./file/file");
const split = require("./split");
const config = require("./config");
const webView = require("./webView");
const { getState, setState, setSync } = require("./util");
/**
 * @type {Chapter} 当前显示章节
 */
let curChapter = null;
/**
 * @type {vscode.ExtensionContext}
 */
// let content;

// extends vscode.TreeDataProvider
class Bookrack {
	/**
	 * @param {any} arr
	 */
	constructor(arr) {
		this.list = this.parseArr(arr);
		// console.warn("创建书架--", arr);
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
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
	// private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
	// readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;
	/**
	 *
	 * @param {String[]} arr
	 */
	refresh(arr) {
		console.warn("执行刷新", arr);
		// 对比差异,目录顺序是固定的,所以返回的也应该是固定的
		for (var i = 0; i < this.list.length; i++) {
			if (this.list[i].fullPath === arr[i]) {
				//如果相等,则什么都不做
			} else {
				//如果不相等,首先判断是否是被删除了
				if (arr.includes(this.list[i].fullPath)) {
					//新增
					let t = path.parse(arr[i]);
					this.list.splice(i, 0, new Book(t.name, i, arr[i], t.base));
				} else {
					//被删除了
					this.list.splice(i--, 1);
				}
			}
			// 可能出现删除或新增,所以i必须更新
			this.list[i].i = i;
		}
		this._onDidChangeTreeData.fire();
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
	 * @_return {Thenable<vscode.TreeItem[]>} 字类型(章节)数组
	 * 这两个应该是兼容的,
	 */
	async getChildren(element) {
		if (!this.list.length) {
			// console.log("getChildren", this.list, element);
			vscode.window.showInformationMessage("没有书");
			return Promise.resolve([]);
		}
		// 返回根元素的子元素(书)
		if (!element) {
			return Promise.resolve(this.list);
		} else {
			// 返回某个元素的子元素,在这里必定的书的子元素,章节
			// vscode.window.showInformationMessage("getChildren--获取章节");
			// console.log(element);
			let t = await element.getChapterList();
			return Promise.resolve(t);
		}
	}
}

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
		//FIXME:书名悬浮显示什么
		this.tooltip = `${this.label}`;
		this.collapsibleState = 1; // 可展开,未展开
		// this.description = this.version;
		this.iconPath = path.join(__filename, "..", "img", "book.png");
		// 自己用的
		this.i = i;
		this.fullPath = fullPath;
		this.base = base;
		this.txt = ""; //文件内容,暂时留空
		/**
		 * @type {Chapter[]}
		 */
		this.chapterList = []; //章节列表,暂时留空
		this.showList = []; // 真正的用来显示的列表
		this.timer = null;
		// 已读章节
		this.readList = getState("book_" + label, []);
		console.warn(label);
		console.warn(this.readList);
	}
	// 获取这本书的章节内容,这个是获取章节列表的最佳方式
	async getChapterList() {
		console.warn(`getChapterList==${this.label}`);
		console.warn(this.readList);
		console.time("获取章节内容时间");
		await this.getContent();
		let arr = split.split(this.txt);
		this.chapterList = arr.map((t, i) => {
			return new Chapter(this, t.s, t.i, t.txtIndex, t.size, this.readList[i] || false);
		});
		console.timeEnd("获取章节内容时间");

		// 如果需要隐藏已读章节
		console.warn("是否隐藏已读章节", !getState("isShowReadChapter", false));
		if (!getState("isShowReadChapter", false)) {
			// 多筛选一遍,并不怎么消耗性能,但是可以提高可维护性
			this.showList = this.chapterList.filter(e => !e.isRead);
		} else {
			this.showList = this.chapterList;
		}
		return this.showList;
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
			// console.time();
			this.txt = await file.readFile(this.fullPath, true);
			// console.timeEnd();
		} catch (error) {
			console.error(error);
			vscode.window.showInformationMessage("获取书内容失败,错误信息已打印到控制台");
		}
	}

	/**
	 * 设置某个章节为已读章节
	 * @param {Number} i 章节下标
	 */
	setReadChapter(i) {
		this.readList[i] = 1; //数据转化为json,所以1应该比true更合适
		setState("book_" + this.label, this.readList);
		// console.warn(this.readList);
		setSync("book_" + this.label);
	}

	clearReadChapter() {
		this.readList = [];
		setState("book_" + this.label, []);
	}
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
	 * @param {Boolean} isRead 是否已读
	 */
	constructor(book, label, i, txtIndex, size, isRead = false) {
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
		this.isRead = isRead;
	}
	/**
	 * 打开本章
	 *
	 */
	async openThis() {
		// console.log(this.i, this.txtIndex, this.size);
		curChapter = this;
		await this.getTxt();
		// console.log(this.content.length);
		let mode = config.get("mode");
		if (mode === "file") {
			this.parseChapterTxt_File();
			await file.openChapter("tmp/" + this.book.label + "/", this.label, this.content);
		} else if (mode === "webView") {
			let lineList = this.parseChapterTxt_WebView();
			// 缓存最后打开的章节
			setState("lastOpenChapter", { title: this.label, i: this.i, bookName: this.book.label });
			webView.showChapter(this.label, lineList);
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
		let lineStart = "".padEnd(config.get("readSetting.lineIndent", 2) * 2, " ");
		let lineEnd = "".padEnd(config.get("readSetting.lineSpace", 1), "\n");
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
			if (item && item.length) {
				res.push(item);
			}
		});
		return res;
	}
	async getTxt() {
		await this.book.getContent();
		this.content = this.book.txt.substring(this.txtIndex + this.title.length, this.txtIndex + this.size);
	}
	/**
	 * 设置当前章节为已读章节
	 */
	setThisRead() {
		this.book.setReadChapter(this.i);
	}
}
async function showChapter(e) {
	//是对章执行的命令
	if (e && e instanceof Chapter) {
		// console.log("showChapter---执行");
		// 打开章节
		e.openThis();
	} else if (e && e instanceof Book) {
		// 对书执行
		vscode.window.showInformationMessage("无法对书进行此操作");
	}
}
async function nextChapter() {
	// 对一个章节进行下一章命令时,会记录当前章节已读
	changeChapter(1, "下", true);
}
async function prevChapter() {
	changeChapter(-1, "上");
}
/**
 * 切换章节
 * @param {Number} n
 * @param {String} s
 * @param {Boolean} isSave 是否保存当前章节为已读章节
 */
async function changeChapter (n, s, isSave = false) {
	console.log('changeChapter',n, s, isSave);
	if (curChapter) {
		if (isSave) {
			//记录当前章节为已读
			curChapter.setThisRead();
		}
		let curBook = curChapter.book;
		let index = curChapter.i;
		console.log(index + n);
		console.log(curBook.chapterList[index + n]);
		curBook.chapterList[index + n].openThis();
	} else {
		vscode.window.showInformationMessage(`未找到${s}一章`);
	}
}
/**
 * 关闭webview
 */
async function closeWebView() {
	await webView.closeWebView();
}
/**
 * 关闭后重新打开webview
 * 如果有缓存的(本次拓展启动后有打开章节),则直接打开
 * 如果没有,则尝试读取存储的记录
 */
async function openWebView() {
	if (curChapter) {
		await curChapter.openThis();
	} else {
		// 读取缓存中的
		vscode.window.showInformationMessage(`正在打开`);
		let data = getState("lastOpenChapter");
		if (data && data.bookName) {
			// 找到那本书
			for (var i = 0; i < bookrack.list.length; i++) {
				if (bookrack.list[i].label === data.bookName) {
					// 防止在没有获取书内容的时候查找章节
					let book = bookrack.list[i];
					await book.getChapterList();
					let ChapterList = book.chapterList;
					let chapter = ChapterList[data.i];
					// 判断章节是否正确(不一定有必要,但是保险起见)
					if (chapter && chapter.label === data.title) {
						chapter.openThis();
					}
					return;
				}
			}
			vscode.window.showInformationMessage(`未找到对应的章节`);
		} else {
			vscode.window.showInformationMessage(`您最近没有打开章节,无法显示`);
		}
	}
}

/*
	对于treeView的
*/

let treeView = null;
let bookrack = null;

function createTreeView (fileList) {
	//, _content
	// content = _content;
	// console.log("createTreeView 执行");
	// vscode.window.registerTreeDataProvider("novelLookTreeView", new Bookrack(t));
	bookrack = new Bookrack(fileList);
	treeView = vscode.window.createTreeView("novelLookTreeView", {
		// @ts-ignore
		treeDataProvider: bookrack,
	});
	// 报了一个treeView未使用的错,我很不爽
	if (treeView) return;
	// treeView.reveal
}
async function refreshFile(isNotMsg) {
	// console.log("执行刷新");
	let list = await file.getBookList();
	bookrack.refresh(list);
	if (!isNotMsg) {
		vscode.window.showInformationMessage("刷新完成");
	}
	return list;
}

async function showReadChapter() {
	setState("isShowReadChapter", true);
	await refreshFile();
}
async function hideReadChapter() {
	setState("isShowReadChapter", false);
	await refreshFile();
}
async function clearReadChapter(e) {
	//是对章执行的命令
	console.log("clearReadChapter---执行");
	if (e && e instanceof Chapter) {
		vscode.window.showInformationMessage("无法对章节进行此操作");
	} else if (e && e instanceof Book) {
		// 对书执行
		// e.collapsibleState = 2;
		e.clearReadChapter();
		await refreshFile();
	}
}

module.exports = {
	command: {
		showChapter,
		nextChapter,
		prevChapter,
		closeWebView,
		openWebView,
		refreshFile, // 刷新treeView显示
		showReadChapter,
		hideReadChapter,
		clearReadChapter,
	},
	Bookrack,
	createTreeView,
	nextChapter,
	prevChapter,
};

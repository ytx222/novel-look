const readFile = require("./file/file");
const split = require("./split");
class Novel {
	constructor(s) {
		this.txt = s;
		// 不可迭代,同时不让报错
		Object.defineProperty(this, "txt", { value: s });
		this.chapterList = split.split(s);
		console.log(this.chapterList);
		this.chapterNum = this.chapterList.length;
		this.size = s.length;
	}
	/**
	 * 获取这本书的某一章
	 * @param {Number} index 要获取的章节
	 */
	getChapter(index) {
		if (index < 0 || index >= this.chapterNum) {
			return { title: "无此章节", content: "无内容", size: 0, index };
		}
		let cur = this.chapterList[index];
		let next = this.chapterList[index + 1] || { index: Number.MAX_VALUE };
		let s = this.txt.substring(cur.index + cur.s.length + 2, next.index);
		return { title: cur.s, content: s, size: s.length, index };
	}
}
Novel.getNovelByPath = async function (path) {
	try {
		let txt = await readFile.readFile(path);
		return new Novel(txt);
	} catch (error) {
		console.log(error);
		throw new Error("创建实例失败");
	}
};

module.exports = Novel;

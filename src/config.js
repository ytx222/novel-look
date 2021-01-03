/**
 * 如果版本更新后这个文件被覆盖了,请自行修改
 */
module.exports = {
	env: "dev", // dev production
	mode: "webView", // file webView
	match: {
		novelName: /^.*\.txt$/, //小说名的正则匹配
		chapterName: /1/, //匹配章节名称
	},
	ignoreDir: ["tmp", "static"],
	ignoreFileName: [],
	openDirReadme: `请将电子书放在本文件所在目录
您可以在本文件上上方tab栏右键选择"在文件资源管理器中显示"
或是您直接将电子书的内容复制到本文件
目录地址: `,
	openDirFileName: "README.md",
	// 阅读设置
	readSetting: {
		// 文件模式
		lineSpace: 1, // 行与行之间以几个换行符分割,文件模式生效
		// webview模式
		lineIndent: 2,
		fontColor: "", //不知道能不能设置
		rootFontSize: 20,
		titleSize: 1.6,
		zoom: 1, // 0.5 - 5 每次滚动0.1
		scrollSpeed: 144, // 自动滚动速度  推荐 72, 96, 120, 144, 168, 192
		scrollEndTime: 3000, //滚动到章节底部的等待时间
		scrollStartTime: 3000, // 章节开始时的滚动时间
	},
};

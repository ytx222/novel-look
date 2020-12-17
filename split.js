const { match } = require("./config");
//  第一章 我要改变世界（上）
match.chapterName = /章/g;
/**
 *
 */
function split(s) {
	/*
	正则版,直接正则匹配
	查找版,查找固定字 如第,章等然后获取整行在进行匹配(正则?)
	*/
	let reg = new RegExp("第[一二三四五六七八九十百千万零]*章", "g");
	let t;
	while ((t = reg.exec(s))) {
		console.log({ s: t[0], index: t.index });
	}
	console.warn(t);
	console.log(s.substring(0,100));
}

exports.split = split;

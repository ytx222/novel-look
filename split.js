const { match } = require("./config");
//  第一章 我要改变世界（上）
match.chapterName = /章/g;
/**
 * @return {Array<Object>} 章节列表
 */
function split(s) {
	/*
	正则版,直接正则匹配
	查找版,查找固定字 如第,章等然后获取整行在进行匹配(正则?)
	*/
	console.time("split");
	let reg = new RegExp("第[一二三四五六七八九十百千万零]*章.*", "g");
	let t;
	//第一章之前的
	let arr = [{ index: 0, s: "头部" }];
	t = reg.exec(s);
	// console.log(t[0],Object.keys(t),t.groups);
	while ((t = reg.exec(s))) {
		arr.push({
			s: t[0],
			index: t.index,
		});
		// console.log({ });
	}
	//FIXME: 大结局可能需要额外的正则或处理
	// 处理大结局之后的
	// arr.push({
	// 	s: "尾",
	// 	index: Number.MAX_VALUE,
	// });

	// console.log(arr);
	console.timeEnd("split");
	return arr;
}

exports.split = split;

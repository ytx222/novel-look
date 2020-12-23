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
	let reg = new RegExp("\\s*第[一二三四五六七八九十百千万零\\d]*章.*", "g");
	let t;
	//第一章之前的
	t = reg.exec(s);
	// 因为头部这两个字,txtIndex要-2,size+2(因为字符串截取)
	let arr = [{ txtIndex: -2, s: "头部", i: 0, size: (t && t.index + 2) || 2 }];
	let i = 0;
	let lastIndex = 0;
	console.log(t + "");
	let lastItem = arr[0];
	console.warn(t.index);
	do {
		let item = {
			s: t[0],
			i: ++i,
			txtIndex: t.index,
			size: t.index - lastIndex,
		};
		arr.push(item);
		lastItem.size = t.index - lastItem.txtIndex;
		// console.log(t.index - lastItem.txtIndex + 1);
		// console.warn(t.index);
		lastIndex = t.index;
		lastItem = item;
	} while ((t = reg.exec(s)) && t);
	//FIXME: 大结局可能需要额外的正则或处理
	// 处理大结局之后的
	// arr.push({
	// 	s: "尾",
	// 	index: Number.MAX_VALUE,
	// });

	console.log(arr);
	console.log([...arr].slice(0, 4));
	return arr;
}

exports.split = split;

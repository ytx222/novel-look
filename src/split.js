const { match } = require("./config");
//  第一章 我要改变世界（上）
match.chapterName = /章/g;
/**
 * @param {String} s
 * @return {Array<Object>} 章节列表
 */
function split(s) {
	/*
	正则版,直接正则匹配
	查找版,查找固定字 如第,章等然后获取整行在进行匹配(正则?)
	*/
	console.time();
	let reg = new RegExp("(?=\\s*)第[一二三四五六七八九十百千万零\\d]*章[^\n]*", "g");
	console.timeEnd();
	let iterator = s.matchAll(reg);
	for (const item of iterator) {
		console.log(item);
	}
	let t;
	//第一章之前的
	t = reg.exec(s);
	// 因为头部这两个字,txtIndex要-2,size+2(因为字符串截取)
	// (t && t.index + 2) || 2  直接赋值为文件长度,如果后面有内容,则覆盖,没有则直接显示头部
	let arr = [{ txtIndex: -2, s: "头部", i: 0, size: s.length }];
	let i = 0;
	let lastIndex = 0;
	let lastItem = arr[0];
	if (t) {
		do {
			// console.log("======================================================================");
			// console.log(t[0],t.index);
			// console.log(lastItem);
			if (t[0].trim() === lastItem.s.trim()) {
				// 退出不保存,这样的话,在下一章的开头会有一个章名和第一行的章名,但是不重要
				continue;
			}
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
		lastItem.size = s.length - lastItem.txtIndex;
	}

	// console.log(arr);
	// console.log([...arr].slice(0, 4));
	return arr;
}

exports.split = split;

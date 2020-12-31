// @ts-nocheck
window.addEventListener("DOMContentLoaded", function () {
	const vscode = acquireVsCodeApi();
	// 元素
	const el = {
		title: document.querySelector(".main .header .title"),
		content: document.querySelector(".main .content"),
	};
	// 本地缓存最新章节和样式设置
	let cache = {};
	let setting = {};
	// postMessage,setState,getState
	console.log("webView页面加载完成");
	let fn = {
		undefined() {
			console.error("webView端找不到处理程序,无法执行");
		},
		/*设置一些公共设置,如行高,行间隔,字体大小等*/
		setting(data) {
			setCache("setting", data);
			setting = data;
			let sheetEl = document.querySelector("style");
			// 这里多一个.body,以达到更高匹配级别
			sheetEl.sheet.insertRule(`.body .main .content div{
					text-indent: ${data.lineIndent}em;
					font-size:1rem;
			}`);
			sheetEl.sheet.insertRule(`html{
				font-size:${data.rootFontSize * data.zoom}px !important;
		}`);
		},
		/*显示章节*/
		showChapter(data) {
			setCache("showChapter", data);
			console.warn("开始显示章节", data.title);
			render(data.title, data.list);
			window.scrollTo(0, 0);
		},
	};
	window.addEventListener("message", function (e) {
		let data = e.data.data;
		let type = e.data.type;
		fn[type](data);
	});
	/**********************************
	 	判断是否是隐藏后重新显示
	 **********************************/
	let data = vscode.getState();
	if (data) {
		for (var item in data) {
			fn[item](data[item]);
		}
	}
	/**
	 * 设置缓存 ,本来的vscode.setState是简单的对象.我自己封装一下成键值对
	 * 既然官方说了高性能,那么这样损耗应该不大(性价比高)
	 * @param {String} key 键
	 * @param {Object} value  值
	 */
	function setCache(key, value) {
		cache[key] = value;
		vscode.setState(cache);
	}

	/**
	 * @param {String} title
	 * @param {Array<String>} lines
	 */
	function render(title, lines) {
		el.title.innerText = title;
		let list = el.content.children;
		el.content.style.display = "none";
		if (list.length < lines.length) {
			addLine(lines.length - list.length);
		}
		var i = 0;
		//FIXME:后期考虑优化性能
		// 比如不能再设置时获取属性,否则必须刷新(回流)
		// 循环添加数据
		for (; i < list.length; i++) {
			if (i < lines.length) {
				list[i].innerText = lines[i];
				list[i].style.display = "block";
			} else {
				list[i].style.display = "none";
			}
		}

		el.content.style.display = "block";
	}
	/**
	 * 在行不够用的情况下添加行
	 */
	function addLine(num) {
		// 因为前期肯定隐藏过了dom,这里不在隐藏
		for (var i = 0; i < num; i++) {
			el.content.appendChild(document.createElement("div"));
		}
	}

	/*********************************
		换章和其他需要和拓展交互的功能
	**********************************/
	window.onkeydown = function (e) {
		switch (e.key) {
			case "ArrowRight": //下一章
				postMsg("chapterToggle", "next");
				break;
			case "ArrowLeft": //上一章
				postMsg("chapterToggle", "prev");
				break;
			case "ArrowDown": //向下翻页
			case "Space":
				scrollScreen(1, e);
				break;
			case "ArrowUp": //向上翻页
				scrollScreen(-1, e);
				break;

			default:
				break;
		}
	};
	window.onmouseup = function (e) {
		// MouseEvent.button MDN https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
		// 0：按下主按钮，通常是向左按钮或未初始化状态
		// 1：按下辅助按钮，通常是滚轮按钮或中间按钮（如果有）
		// 2：按下辅助按钮，通常是右键
		// 3：第四个按钮，通常是“浏览器后退”按钮
		// 4：第五个按钮，通常是“浏览器前进”按钮
		switch (e.button) {
			case 1:
			case 4:
				postMsg("chapterToggle", "next");
				break;
			case 3:
				postMsg("chapterToggle", "prev");
				break;
			default:
				break;
		}
	};
	document.querySelector(".footer .btn-box .prev").onclick = () => postMsg("chapterToggle", "prev");
	document.querySelector(".footer .btn-box .next").onclick = () => postMsg("chapterToggle", "next");

	/**
	 * 上线翻页(一个屏幕)
	 * @param {Number} direction 方向 1下 -1上
	 * @param {Event} event  用来阻止默认行为
	 */
	function scrollScreen(direction = 1, event) {
		event.preventDefault();
		let cur = window.scrollY;
		let h = document.documentElement.clientHeight - 60;
		window.scrollTo(0, cur + h * direction);
	}

	{
		let isAutoScrollScreen = false;
		let timer = 0;
		let num = 0; // 当前滚动高度
		let h = 0; // 窗口高度
		let max = 0; // 窗口最大高度
		window.ondblclick = autoScrollScreen;
		/**
		 * 自动滚屏
		 */
		function autoScrollScreen() {
			console.warn("autoScrollScreen");
			if (isAutoScrollScreen) {
				clearInterval(timer);
			} else {
				num = window.scrollY;
				max = document.body.scrollHeight;
				h = document.documentElement.clientHeight;
				timer = setInterval(scroll, getIntervalTime());
				//FIXME: 当前章节结束,自动下一章,自动开始滚屏,机制需要优化
			}
			isAutoScrollScreen = !isAutoScrollScreen;
		}
		// 问题是每多少时间向下移动1
		function scroll() {
			window.scrollTo(0, ++num);
			if (num >  max - h) { 
				// 章节结束
			}
		}
		// 获取间隔时间
		function getIntervalTime() {
			let scrollSpeed = setting.scrollSpeed || 120;
			return Math.round(1000 / scrollSpeed);
		}
	}
	// 发送消息
	function postMsg(type, data) {
		vscode.postMessage({ type, data });
	}
});

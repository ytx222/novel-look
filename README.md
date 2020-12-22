# 简单的说明文件

# 配置项
- 图标统一E6E6E6
- Alt+s 显示
- Alt+s 隐藏
- 左右箭头(按键)翻页 
- 上下按钮距离?
- 快速翻页按键(快速翻页模式?一次点击翻一页?)
12.17

https://code.visualstudio.com/api/references/contribution-points#contributes.configuration

对书md5,保留读书的记录,然后不显示已读章节
书菜单
	打开此书(vscode 打开)
	显示已读章节(已读章节有标记)
	清空已读章节
	删除文件
	删除列表(不删除文件)
列表中增加一种类型,文件夹?


FIXME: 增加一个 + 用来新增文件(电子书)
测试获取书的内容失败
阅读模式文件预读?
更换图标

样式控制
通过主题?
通过语言+主题?
自己手动处理字符串控制
TODO: 多余字符在哪里处理更合适?

对于换行
Editor: Accessibility Support
控制编辑器是否应在对屏幕阅读器进行了优化的模式下运行。设置为“开”将禁用自动换行
TODO: 章节匹配有bug

## 我的记录
- configurations.property必须是对象
	- 原因是添加了vscode不识别的键
- Promise和Thenable可以兼容(不报错)
- 控制台输出读取文件的内容,会报错,太大了无法输出,而且会卡几秒
- 验证清除txt节省内存效果 107-81,并且之后有几个时间点不进行内存清理
	- 所以说,选择一个合适的实际清除txt有必要



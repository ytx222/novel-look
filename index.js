const readFile = require("./readFile");

// readFile
// 	.readDir("./")
// 	.then(function (e) {
// 		console.log(e);
// 	})
// 	.catch(function (err) {
// 		console.error(err);
// 	});

// .then(function (e) {
// 	console.log(e && e.length);
// })
// .catch(function (err) {
// 	console.error(err);
// });

async function open() {
	try {
		let s =await readFile.readFile("D:\\_ytx\\test_work\\novel-look\\神工.txt");
		console.log(s.length);
	} catch (error) {}
}
open();

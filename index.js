const readFile = require("./readFile");
const split = require("./split");
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
		let s =await readFile.readFile("./神工.txt");
		console.log(s.length);
		split.split(s)
	} catch (error) {
		console.log(error);
	}
}
open();

const puppeteer = require('puppeteer');
const logger = require('./lib/logger');
const Eleme = require('./eleme');
const accounts = require('./data/accounts');

(async() => {
	const browser = await puppeteer.launch({
		headless: false,
		devtools: true,
		args: ['--auto-open-devtools-for-tabs']
	});
	// const browser = await puppeteer.launch();
	try {
		let eleme = new Eleme(browser);
		eleme.regist(accounts);
		await eleme.start();
		await browser.close();

	} catch (err) {
		logger.error('unhandle error', err);
		await browser.close();
	}

	// process.on('exit', async(code) => {
	// 	await browser.close();
	// 	logger.info(`终止进程 code: ${code}`);
	// });
})();
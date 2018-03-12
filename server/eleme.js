const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6 Plus'];
const logger = require('./lib/logger');
const { uri, headers } = require('./config');
const sleep = require('./lib/sleep');
const fs = require('fs');

class Eleme {
	constructor(browser) {
		this.uri = uri;
		this.userAgent = headers.userAgent;
		this.browser = browser;
		this.accounts = [];
		this.page = null;
	}

	regist(accounts) {
		this.accounts = accounts;
	}

	async start() {
		let { browser, userAgent, accounts } = this;

		let cookies = [];
		for (let { username, password } of accounts) {
			let page = await browser.newPage()
			await page.emulate(iPhone);
			await page.setUserAgent(userAgent);
			await page.setCacheEnabled(false);
			this.page = page;

			try {
				let cookie = await this.getCookie(username, password);
				logger.info('获得', username, 'cookie');
				cookies.push(cookie);
			} catch (error) {
				logger.error('账号', username, '获取cookie失败', error);
			}

			//目前Network.clearBrowserCookies 无法清除正在写入的cookie 页面关闭也无法阻止cookie写入
			//增加延时 但不是什么好方式
			//有没有大佬给点意见
			await sleep(1000);
			await this.destory();
			await sleep(3000); //增加延时 饿了么报错 操作太频繁
		}

		fs.writeFileSync('./data/cookies.json', JSON.stringify(cookies));
	}

	async getCookie(username, password) {
		let { page } = this;
		await this.qqLogin(username, password);

		//进入饿了么红包页面 获取cookie
		let cookie = await page.evaluate(() => {
			return document.cookie;
		});

		if (cookie.indexOf('snsInfo') === -1) {
			let networkCookies = await page._client.send('Network.getAllCookies');
			logger.error('所获取cookie格式有误', cookie, networkCookies);
			throw new Error('所获取cookie格式有误');
		}

		return cookie;
	}

	async qqLogin(username, password) {
		let { page, uri } = this;
		await page.goto(uri);
		//登陆
		await page.waitForSelector('#web_login');

		//清空自动填写的登陆信息
		await page.evaluate(() => {
			let deluBtn = document.querySelector('#del_u');
			let delpBtn = document.querySelector('#del_p');
			deluBtn.click();
			delpBtn.click();
		})

		//用户密码登陆
		await page.type('#web_login .input_id', username, { delay: 50 });
		await page.type('#web_login .input_pwd', password, { delay: 50 });

		let qqLoginBtn = await page.$('#go')
		await qqLoginBtn.click();

		//打开触摸板 QQ安全认证时需要
		await page._client.send('Emulation.setEmitTouchEventsForMouse', {
			enabled: true
		});

		//等待完全进入eleme红包页面
		// await page.waitForNavigation({ timeout: 0, waitUntil: 'networkidle2' })

		//等待人为填写QQ安全认证码
		await this.waitForCertificateEach(10000);
		let accessUrl = page.url();
		if (accessUrl.indexOf('https://h5.ele.me') === -1) {
			logger.error('进入饿了么红包页面出错', accessUrl);
			throw new Error('进入饿了么红包页面出错')
		}
	}

	/**
	 * 等待QQ认证结束
	 * 主要处理页面异常关闭 如配置账号密码不正确手动关闭
	 * 讲道理应该通过page close event处理人为或异常关闭
	 * 但由于puppeteer并未加入该feature
	 * 需要在puppeteer的lib/page下添加事件监听和触发
	 * 由于项目失败不fork puppeteer进行更改
	 * 有没有大佬给点意见
	 */
	async waitForCertificateEach(timeout) {
		let { page, browser } = this;

		let targets = browser.targets()
		try {
			let target = page.target();
			if (targets.some(t => t == target)) {
				await page.waitForNavigation({ timeout, waitUntil: 'networkidle2' })
			}
		} catch (error) {
			await this.waitForCertificateEach(timeout);
		}
	}

	async destory() {
		let { page } = this;
		try {
			//清除cookies puppeteer目前仅支持的清楚所有cookies的方式
			await page._client.send('Network.clearBrowserCookies');
			await page.close();
		} catch (error) {
			//意外关闭页面
			logger.error('清空浏览器cookies失败', error)
		}
	}
}

module.exports = Eleme;
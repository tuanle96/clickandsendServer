var express = require('express');
var router = express.Router();

const cheerio = require('cheerio');
const request = require('request');
const puppeteer = require('puppeteer');

const USERNAME = "nguyenvietnamson" //nguyenvietnamson
const PASSWORD = "namson270231" //namson270231
const OPTIONS = {
    waitUntil: 'load'
}

router.get('/', (req, res) => {
    res.render('index', { title: 'API FOR G3G4.VN' });
});

router.post('/sendSMS', (req, res) => {

    const phoneNumber = req.body.phoneNumber;
    const entry = req.body.entry;

    var workflow = new (require('events').EventEmitter)();

    workflow.on('validate-parameters', () => {
        if (!phoneNumber) {
            workflow.emit('error-handler', 'Phone number is required');
            return
        }

        if (!entry) {
            workflow.emit('error-handler', 'Entry is required');
            return
        }

        workflow.emit('send-sms')
    });

    workflow.on('send-sms', () => {
        sendSMS(phoneNumber, entry).then(() => {
            res.json({ success: "OK" });
        }).catch((error) => {
            workflow.emit('error-handler', error)
        })        
    });

    workflow.on('error-handler', (err) => {
        res.json({ error: err });
    });

    workflow.emit('validate-parameters');
})

async function sendSMS(phone, entry) {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://g3g4.vn/sms/login.jsp');

    //login
    const username = await page.$('#username'); //input username
    const password = await page.$('#passWord'); //input password
    const button = await page.$('#a > p:nth-child(9) > button');    //button login
    await username.type(USERNAME);    //type username to input
    await password.type(PASSWORD);    //type password to input
    await button.click();   //and click to login button to start login

    //wait for web forward to user manager if login successfully
    await page.waitFor(2500);

    //hover menu bar to show item
    const menuBar = await page.$('#myMenuID > table > tbody > tr > td:nth-child(3) > span.ThemeOfficeMainFolderText');
    await menuBar.hover();

    //click vao trang gui sms
    const itemMenu = await page.$('#cmSubMenuID3 > table > tbody > tr:nth-child(3) > td.ThemeOfficeMenuItemText');
    await itemMenu.click();
    await page.waitFor(1000);

    //chuyen sang trang gui sms
    const pageLists = await browser.pages();
    const mainPage = pageLists[pageLists.length - 1];
    await mainPage.bringToFront();

    //input phone number
    const phoneNumber = await mainPage.$('#suhork');
    await phoneNumber.type(phone);

    //noi dung    
    const noidung = await mainPage.$('#iutzktz');
    await noidung.type(entry);

    //set brandname
    async function setSelectVal(sel, val) {
        mainPage.evaluate((data) => {
            return document.querySelector(data.sel).value = data.val
        }, { sel, val })
    }

    //add new brandname to select option
    async function addNewOption(sel) {
        mainPage.evaluate((data) => {
            var x = document.getElementById(data.sel);
            var option = document.createElement("option");
            option.text = 'SONDEPTRAI'
            option.value = '1655'
            x.add(option);
        }, { sel })
    }

    await setSelectVal('#loaisp', '2')
    await addNewOption('hxgtjtgsk');
    await setSelectVal('#hxgtjtgsk', '1655')

    //wating for confirm dialog and confirm to send sms
    mainPage.on('dialog', async dialog => {
        await dialog.accept();
    });

    //excute send sms action with js
    await mainPage.evaluate(() => {
        action_click();
    });

    await page.waitFor(500);

    await browser.close();
}

module.exports = router;
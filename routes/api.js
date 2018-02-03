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

// router.get('/sendSMS', (req, res) => {
  //   const phoneNumber = req.params.phoneNumber || "01629680825";
    // const entry = req.params.entry || "XIN CHAO BAN";

    // sendSMS(phoneNumber, entry).then(() => {
      //   res.json({ success: "OK" });
     //}).catch((error) => {
       //  res.json({ error: error });
    // })
// })

router.post('/sendSMS', (req, res) => {

    const phoneNumber = req.body.phoneNumber;
    const entry = req.body.entry;

    if (!phoneNumber) {
        res.json({ error: "Phone Number is required" });
        return
    }

    if (!entry) {
        res.json({ error: "Entry is required" });
        return
    }

    sendSMS(phoneNumber, entry).then(() => {
        res.json({ success: "OK" });
    }).catch((error) => {
//	console.log("ERROR");
        res.json({ error: error });
    });
})

async function sendSMS(phone, entry) {
//console.log("0")
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
//	console.log("1");
    const page = await browser.newPage();
//	console.log("2");
 await page.goto('https://g3g4.vn/sms/login.jsp');
//console.log("3");
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

    await mainPage.waitFor(500);

    await mainPage.screenshot({ path: Date.now() / 1000 + ".png" })

    await browser.close();
}

module.exports = router;

const puppeteer = require("puppeteer");

const code = "02378-13230-72825-18446-00126-4";
const splitCode = code.split("-");

(async () => {
    const browser = await puppeteer.launch({ args: ['--incognito'], headless: false, slowMo: 50 });
    // Create a new incognito browser context
    const page = await browser.newPage();

    await page.goto('https://www.mcdvoice.com/');
    // Wait until the input with ID CN1 is available
    await page.waitForSelector('#CN1');
    
    // #1 Fill in the code for each input
    for (let i = 0; i < 6; i++) {
        await page.type(`#CN${i+1}`, splitCode[i]);
    }
    await page.click("#NextButton");
    
    // #2 How did you place your order?
    await page.waitForSelector('input[type="radio"]', { visible: true });
    //? using mcdonalds app
    await page.click('input[type="radio"]'); //! clicks on the first option, no checking
    await page.click("#NextButton");

    // !
    await page.waitForSelector('input[type="radio"]', { visible: true });
    // get all labels and click the one that conatins text
    await page.evaluate(() => {
        
        const labels = Array.from(document.querySelectorAll('label'));
        const match = labels.find(el => el.textContent.includes('Using a kiosk'));
        if (match) match.click();
    });
    await page.click("#NextButton");
    // !

    // #3 Visit type?
    await page.waitForSelector('input[type="radio"]', { visible: true });
    //? curbside
    await page.click('input[type="radio"]'); //! clicks on the first option, no checking
    await page.click("#NextButton");
    
    // #4 overall satisfaction
    await page.waitForSelector('input[type="radio"]', { visible: true });
    //? highly satisfied
    await page.click('input[type="radio"]'); //! clicks on the first option, no checking
    await page.click("#NextButton");
    
    // #5 Member of MyMcDonald's Rewards?
    await page.waitForSelector('input[type="radio"]', { visible: true });
    //? yes
    await page.click('input[type="radio"]'); //! clicks on the first option, no checking
    await page.click("#NextButton");
    
    // #6 Did the employee ask if you were using your mobile app?
    await page.waitForSelector('input[type="radio"]', { visible: true });
    //? yes
    await page.click('input[type="radio"]'); //! clicks on the first option, no checking
    // #7 Did the employee greet you by name or thank you for being a rewards member?
    //? yes
    await page.click('#R000474.1');
    await page.click("#NextButton");
    
    // #8 Rate your satisfaction with (6 factors)...
    //? highly satisfied #1
    await page.click('input[type="radio"]'); //! clicks on the first option, no checking
    //? highly satisfied #2
    await page.click('#R000351.5');
    //? highly satisfied #3
    await page.click('#R006000.5');
    //? highly satisfied #4
    await page.click('#R007000.5');
    //? highly satisfied #5
    await page.click('#R009000.5');
    //? highly satisfied #6
    await page.click('#R011000.5');
    await page.click("#NextButton");
    
    // #9 Did the employee ask if you were using your mobile app?
    //? yes
    await page.click('input[type="radio"]'); //! clicks on the first option, no checking

    const html = await page.content();
    console.log(html);
    await browser.close();
})();
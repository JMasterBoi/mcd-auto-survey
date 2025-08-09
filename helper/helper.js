// import puppeteer from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';
import chromium from '@sparticuz/chromium';

// const code = "02378-13230-72825-18446-00126-4";

puppeteer.use(StealthPlugin());

function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

const launchOptions = {
  args: chromium.args.concat(['--no-sandbox','--disable-setuid-sandbox', '--incognito']),
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
};

export async function fillSurvey(code, reportProgress, codesDb) {
    reportProgress(0)
    const splitCode = code.split("-");
    /*const valCode = */await (async () => {
        let ret;
        const survey = [
            {
                question: "How did you place your order?",
                type: "radio",
                selection: ["With an employee at the restaurant"]
            },
            {
                question: "Please select your visit type:",
                type: "radio",
                selection: ["Dine-in"]
            },
            {
                question: "Please rate your overall satisfaction with your experience at this",
                type: "radio",
                selection: [0]
            },
            {
                question: "Are you a member of My",
                type: "radio",
                selection: [0]
            },
            {
                question: "Did the employee ask if you were using your mobile app?", //!Did the employee greet you by name or thank you for being a Rewards member? 
                type: "radio",
                selection: [0, 2]
            },
            //! {
            //!     question: "The cleanliness of the restaurant.", //just one of the 6
            //!     type: "radio",
            //!     selection: [0, 5, 10, 15, 20, 25] // first option of 5 for every row
            //! },
            {
                question: "The cleanliness of the restaurant.", //just one of the 6
                type: "radio",
                selection: ["count"] // first option of 5 for every row
            },
            {
                question: "The speed of service.", 
                type: "radio",
                selection: ["count"]
            },
            {
                question: "The ease of placing your order.", 
                type: "radio",
                selection: ["count"]
            },
            {
                question: "The taste of your food.", 
                type: "radio",
                selection: ["count"]
            },
            {
                question: "The temperature of your food.", 
                type: "radio",
                selection: ["count"]
            },
            {
                question: "The quality of your food.", 
                type: "radio",
                selection: ["count"]
            },
            {
                question: "The friendliness of the employees.", 
                type: "radio",
                selection: ["count"]
            },
            {
                question: "The accuracy of your order.", 
                type: "radio",
                selection: ["count"]
            },
            {
                question: "The overall value for the price you paid.", 
                type: "radio",
                selection: ["count"]
            },
            {
                question: "Which of the following did you order on this visit? (Please select all that apply.)", 
                type: "multiple",
                selection: ["Breakfast", "Burgers, Chicken & Fish"]//!, "Beverages & Coffee", "Sweet Treats"]
            },
            {
                question: "Which of the following breakfast items did you order? (Please select all that apply.)", 
                type: "multiple",
                selection: ["Muffin Sandwich", "McGriddle Sandwich", "Hotcakes"]
            },
            {
                question: "Which of the following Burger, Chicken & Fish items did you order? (Please select all that apply.)", 
                type: "multiple",
                selection: ["Big Mac", "McChicken", "Fries"]
            },
            // {
            //     question: "Which of the following Beverages & coffee items did you order? (Please select all that apply.)", 
            //     type: "multiple",
            //     selection: ["Iced Coffee", "Mocha", "Soft Drink"]
            // },
            // {
            //     question: "Which of the following Sweet Treat items did you order? (Please select all that apply.)", 
            //     type: "multiple",
            //     selection: ["Cone", "McFlurry"]
            // },
            {
                question: "The quality of your McGriddle Sandwich.", 
                type: "radio",
                selection: ["count"]
                // selection: [0, 5, 10, 15, 20, 25]
            },
            {
                question: "Did you experience a problem during your visit?", 
                type: "radio",
                selection: [1]
            },
            {
                question: "Did you purchase an item from the $1 $2 $3 Dollar menu?", 
                type: "radio",
                selection: [1]
            },
            // {
            //     question: "1", 
            //     type: "radio",
            //     selection: [1]
            // },
            {
                question: "Return to this", 
                type: "radio",
                selection: [0, 5]
            },
            {
                question: "Thank you for your feedback. We love to share positive stories with our restaurant teams. Please tell us what you liked best about your experience.",
                type: "text",
                text: "I really like how jack was so kind and thoughtful. Jack was an amazing employee and gave me amazing recommendations. He treated me not as a customer, but as a king!"
            },
            {
                question: "Did an employee visit your table after you received your order?", 
                type: "radio",
                selection: [0]
            },
            {
                question: "Including this visit, how many times have you visited any ", 
                type: "radio",
                selection: [0]
            },
            {
                question: "Which of the following fast food restaurants do you consider your favorite?", 
                type: "radio",
                selection: ["McDonald’s"]
            },
            {
                question: "McDonald’s is a brand I trust.", 
                type: "radio",
                selection: [0]
            },
            {
                question: "Please indicate your annual household income:", 
                type: "skip"
                // type: "select",
                // selection: "4"
            },
            //? last one!
            {
                question: "Thank you for completing this survey.", 
                type: "success",
            },
        ]
    

        const browser = await puppeteer.launch(launchOptions);
        // const browser = await puppeteer.launch({ args: ['--incognito'], headless: false});

        // Create a new incognito browser context
        const page = await browser.newPage();

        // delete cookies
        await browser.deleteCookie(...(await browser.cookies()));

        // randomize UA & viewport
        const ua = randomUseragent.getRandom();
        await page.setUserAgent(ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36');

        
        await page.setViewport({
        width: randInt(1024, 1440),
        height: randInt(720, 900),
        deviceScaleFactor: 1
        });

        // emulate timezone (optional)
        try { await page.emulateTimezone('America/Los_Angeles'); } catch(e){ console.log("time zone setting not allowed") }

        // reduce fingerprinting surface (extra safety)
        await page.evaluateOnNewDocument(() => {
        // pretend navigator.webdriver = false
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        // fake languages
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US','en'] });
        });

        // small random delay before starting interactions
        await sleep(randInt(300, 1200));

        //# -------AFTER THIS IS ACTUAL LOGIC-----

        await page.goto('https://www.mcdvoice.com/');

        // Wait until the input with ID CN1 is available
        await page.waitForSelector('#CN1');
        
        // #1 Fill in the code for each input
        for (let i = 0; i < 6; i++) {
            await page.type(`#CN${i+1}`, splitCode[i]);
        }

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click("#NextButton")
        ]);
        
        // await new Promise(resolve => setTimeout(resolve, 3000000));
        while (true) {
            const progressElement = await page.$('#ProgressPercentage');
            if (progressElement) {
                const percentProgress = await page.$eval('#ProgressPercentage', el => el.innerText.replace("%", ""));
                reportProgress(percentProgress)
            }


            let exit = false;
            // check question
            let currentQuestion = null;
            
            for (const q of survey) {
                const hasText = await page.evaluate((text) => {
                    const body = document.body;
                    return body?.innerText?.includes(text) || false;
                }, q.question);
                            
                if (hasText) {
                    currentQuestion = q;
                    console.log("Matched question:", currentQuestion.question);
                    break; // stop at the first match
                }
            }
            
            //! helps with debugging
            // if (!currentQuestion) {console.log("current question is null, check console"); await new Promise(resolve => setTimeout(resolve, 30000));}
            // await new Promise(resolve => setTimeout(resolve, 500));
            
            if (!currentQuestion) {
                console.log("no current question")
                reportProgress("error");
                await browser.close();
                return;
            }

            console.log("currentQuestion:", currentQuestion)

            switch (currentQuestion?.type) {
                case "radio":
                    await page.waitForSelector('input[type="radio"]', { visible: true });
                    console.log("currentQuestion.selection", currentQuestion.selection)
                    for (const selection of currentQuestion.selection) {
                        // await new Promise(resolve => setTimeout(resolve, 30));
                        console.log("selection", selection)
                        // if its the first select first
                        // if (selection == "first") await page.click('input[type="radio"]'); 
                        if (!isNaN(Number(selection))) { // if its a number click nth radio
                            console.log("method: nth radio")
                            await page.evaluate((i) => {
                                const radios = document.querySelectorAll('input[type="radio"]');
                                if (radios[i]) radios[i].click();
                                else throw new Error("Radio input at index " + i + " not found");
                            }, Number(selection));
                        }
                        else if (selection == "count") {
                            console.log("method: count")
                            await page.evaluate(() => {
                                const radios = document.querySelectorAll('input[type="radio"]');
                                for (let i = 0; i < (radios.length / 5); i++) {
                                    if (radios[i*5]) radios[i*5].click();
                                    else throw new Error("Recursive radio input at index " + i + " not found");
                                }
                            })
                        }
                        else {
                            // click the label
                            console.log("method: click label")
                            await page.evaluate((textToFind) => {
                                const labels = Array.from(document.querySelectorAll('label'));
                                const match = labels.find(el => el.textContent.includes(textToFind));
                                if (match) match.click();
                                else {
                                    throw new Error("Didn't find clickable: " + textToFind)
                                }
                            }, selection);
                        }
                    }
                    break;
                case "multiple":
                    for (const selection of currentQuestion.selection) {
                        await page.evaluate((textToFind) => { //! overlaps with radio
                            const labels = Array.from(document.querySelectorAll('label'));
                            const match = labels.find(el => el.textContent.includes(textToFind));
                            if (match) match.click();
                            else {
                                throw new Error("Didn't find clickable: " + textToFind)
                            }
                        }, selection);
                    }
                    break;
                case "text":
                    console.log("TEXTTT!!")
                    await page.type('textarea', currentQuestion.text);
                    break;
                case "select":
                    console.log("select")
                    await page.waitForSelector('select', { visible: true });
                    await page.select('select', currentQuestion.selection);
                    break;
                case "success":
                    console.log("success!")
                    const valCode = await page.$eval('.ValCode', el => el.innerText.split(" ")[2].trim());
                    console.log("ret: ", ret)

                    const codeDocument = {
                        _id: code,
                        user: 0,
                        valCode: valCode
                    }
                    
                    await codesDb.updateOne(
                        {_id: code},
                        {$set: codeDocument},
                        {upsert: true}
                    ).catch((err) => {
                        console.log("Error with mongo: ", err)
                    })

                    reportProgress(100)
                    exit = true;
                    break;
                case "skip":
                    console.log("skipping this one");
                    break;
                default:
                    console.log("no good")
                    reportProgress("error")
                    exit = true;
                    break;
            }
            
            //! await new Promise(resolve => setTimeout(resolve, 500));
    
            console.log("\n\n")

            //! ai code for clicking the next button
            try {
                const nextButton = await page.$('#NextButton');
                if (nextButton) {
                    console.log("Clicking Next button...");
                    
                    // Try to wait for navigation, but don't fail if it doesn't happen
                    try {
                        await Promise.all([
                            page.waitForNavigation({ 
                                waitUntil: 'networkidle0', 
                                timeout: 10000 
                            }),
                            page.click("#NextButton")
                        ]);
                    } catch (navError) {
                        // If navigation times out, just click the button
                        console.log("Navigation timeout, continuing...");
                        await page.click("#NextButton");
                        // await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } else {
                    console.log("No Next button found, survey may be complete");
                    break;
                }
            } catch (error) {
                console.log("Error clicking Next button:", error.message);
                break;
            }

            if (exit) break;
        }
        
        await browser.deleteCookie(...(await browser.cookies()));
        // await page.evaluate(() => {
        // // localStorage.clear();
        // sessionStorage.clear();
        // });

        await browser.close();
        return ret;
    })();
    
    // console.log("valCode:", valCode)
}

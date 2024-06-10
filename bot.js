const puppeteer = require('puppeteer');

let executionCount = 0;
let intervalId;

async function runBot() {
    executionCount++;
    console.log(`Starting execution ${executionCount}...`);

    if (executionCount >= 10) {
        clearInterval(intervalId); // Stop the interval after 10 executions
        console.log("Reached the maximum number of executions.");
        return;
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    console.log('Navigating to the page...');
    try {
        await page.goto('https://www.ligaportal.at/noe/2-klasse/2-klasse-marchfeld/spieler-der-runde/106508-2-klasse-marchfeld-waehle-den-beliebtesten-tipgame-com-spieler-der-saison-23-24', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        console.log('Page loaded successfully');
    } catch (error) {
        console.error('Failed to load the page:', error);
        await browser.close();
        return;
    }

    try {
        console.log('Waiting for the cookie button...');
        const allFrames = page.frames();
        let foundButton = false;
        for (const frame of allFrames) {
            try {
                const cookieButton = await frame.waitForSelector('button#save.mat-focus-indicator.solo-button.mat-button.mat-button-base.mat-flat-button', { visible: true, timeout: 100 });
                if (cookieButton) {
                    console.log('Cookie button found in a frame, clicking it...');
                    await frame.evaluate(button => button.click(), cookieButton);
                    foundButton = true;
                    break;
                }
            } catch (frameError) {
                console.log(`Button not found in the current frame: ${frameError}`);
            }
        }

        if (!foundButton) {
            console.log('Cookie button not found in any frames.');
            await page.screenshot({ path: 'cookie-button-not-found.png' });
            await browser.close();
            return;
        } else {
            console.log('Cookie button clicked');
        }

        // Click "Nein danke" button after cookie banner
        console.log('Clicking the "Nein danke" button...');
        await page.waitForSelector('button.btn.btn-secondary.gb-push-denied');
        await page.click('button.btn.btn-secondary.gb-push-denied');
        console.log('Clicked the "Nein danke" button');

        // Scroll down the page
        console.log('Scrolling down the page...');
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5)); // Scroll down further

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Wait for the iframe to load
        await page.waitForSelector('iframe[src*="iframe-loader-mk2.html"]');

        // Switch to the iframe
        const iframeElement = await page.$('iframe[src*="iframe-loader-mk2.html"]');
        const frame = await iframeElement.contentFrame();
        if (!frame) {
            console.error('Could not find iframe content');
            await browser.close();
            return;
        }

        // Now interact with elements inside the iframe
        console.log('Opening the accordion for SCU Obersdorf/P...');
        const accordionButton = await frame.waitForSelector('a.btn.btn-link.d-block.w-100.d-flex.justify-content-between.align-items-center.text-left.p-2.text-dark[data-target="#collapse-1542"]');
        await accordionButton.click();
        console.log('Accordion opened for SCU Obersdorf/P.');

        // Clicking on Ronald Reinwald
        console.log('Clicking on Ronald Reinwald...');
        await frame.waitForSelector('input#voteItem-335244');
        await frame.click('input#voteItem-335244');
        console.log('Clicked on Ronald Reinwald.');

        // Wait for 2 seconds before clicking the submit button
        console.log('Waiting for 2 seconds before clicking the submit button...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Clicking the submit button
        console.log('Clicking the submit button...');
        await frame.waitForSelector('input#playerOneUp');
        await frame.click('input#playerOneUp');
        console.log('Clicked the submit button.');

        // Wait for the page to settle after submission
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Scroll to the top of the page
        console.log('Scrolling to the top of the page...');
        await frame.evaluate(() => {
            window.scrollTo(0, 0);
        });

        // Take a screenshot
        console.log('Taking a screenshot of the page...');
        await page.screenshot({ path: `screenshot_${executionCount}.png`, fullPage: true });
        console.log('Screenshot taken.');
    } catch (error) {
        console.error('An error occurred during interactions:', error);
        await page.screenshot({ path: 'interaction-error.png' });
    } finally {
        await browser.close();
        console.log(`Execution ${executionCount} complete.`);
    }
}

// Initialize the repeated execution
intervalId = setInterval(runBot, 11 * 60 * 1000); // Set to run every 11 minutes
runBot(); // Also run immediately when the script is started
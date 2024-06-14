const puppeteer = require('puppeteer');

let executionCount = 0;
const maxExecutions = 500;

async function runBot(interactWithCookieButton = true) {
    executionCount++;
    console.log(`Starting execution ${executionCount}...`);

    if (executionCount > maxExecutions) {
        console.log("Reached the maximum number of executions.");
        return;
    }

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--disable-notifications' // disable push notifications
        ],
        defaultViewport: null,
        ignoreDefaultArgs: ['--enable-automation']
    });
    const page = await browser.newPage();

    console.log('Navigating to CroxyProxy...');
    try {
        await page.goto('https://www.croxyproxy.com/_de/', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        console.log('CroxyProxy page loaded successfully');

        // Click away the cookie banner
        const cookieButtonSelector = 'button.fc-button.fc-cta-consent.fc-primary-button[aria-label="Einwilligen"]';
        const cookieButton = await page.waitForSelector(cookieButtonSelector, { visible: true });
        if (cookieButton) {
            console.log('Clicking the cookie banner button...');
            await page.click(cookieButtonSelector);
            console.log('Cookie banner button clicked');
        }
    } catch (error) {
        console.error('Failed to load CroxyProxy page or click the cookie banner:', error);
        await browser.close();
        return;
    }

    try {
        console.log('Entering URL in the input field...');
        await page.type('input#url', 'https://www.ligaportal.at/noe/2-klasse/2-klasse-marchfeld/spieler-der-runde/106508-2-klasse-marchfeld-waehle-den-beliebtesten-tipgame-com-spieler-der-saison-23-24');

        console.log('Clicking the submit button...');
        await page.click('button#requestSubmit');

        // Wait for the redirected page to load
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
        console.log('Redirected page loaded successfully');

        // Perform the rest of the actions on the redirected page, optionally interact with the cookie button
        if (interactWithCookieButton) {
            await new Promise(resolve => setTimeout(resolve, 15000));
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
        }

        // Click "Nein danke" button after cookie banner if it exists
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Checking for the "Nein danke" button...');
        const neinDankeSelector = 'button.btn.btn-secondary.gb-push-denied';
        const neinDankeButton = await page.$(neinDankeSelector);
        if (neinDankeButton) {
            console.log('Clicking the "Nein danke" button...');
            await page.click(neinDankeSelector);
            console.log('Clicked the "Nein danke" button');
        } else {
            console.log('"Nein danke" button not found, proceeding...');
        }

        // Scroll down the page
        console.log('Scrolling down the page...');
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5)); // Scroll down further

        await new Promise(resolve => setTimeout(resolve, 7000));

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
        runBot(interactWithCookieButton); // Start the next execution
    }
}

// Start the first execution
runBot(true); // Pass true or false based on whether you want to interact with the cookie button

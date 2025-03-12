const { crawlPage } = require('./crawl.js');
const { printReport } = require('./report.js');
const { createObjectCsvWriter } = require('csv-writer');

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

async function main() {
    if (process.argv.length < 3) {
        console.log("no website provided");
        process.exit(1);
    }
    if (process.argv.length > 3) {
        console.log(`too many command line args`);
    }

    const baseURL = process.argv[2];
    console.log(`starting crawl of ${baseURL}`);
    const pages = await crawlPage(baseURL, baseURL, {});

    // Print the report to the console
    printReport(pages);

    // Write the report to a CSV file
    const csvWriter = createObjectCsvWriter({ // Use createObjectCsvWriter
        path: 'crawl_report.csv',
        header: [
            { id: 'url', title: 'URL' },
            { id: 'count', title: 'Count' }
        ]
    });

    const records = Object.entries(pages).map(([url, count]) => ({
        url,
        count
    }));

    try {
        await csvWriter.writeRecords(records);
        console.log('The CSV file was written successfully');
    } catch (err) {
        console.error('Error writing CSV file', err);
    }

    // Convert pages object to an array for the HTML template
    const pagesArray = Object.entries(pages).map(([url, count]) => ({
        url,
        count
    }));

    // Serve the HTML interface
    app.get('/', (req, res) => {
        // Read the HTML template
        const htmlPath = path.join(__dirname, 'report.html');
        fs.readFile(htmlPath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Error loading HTML template');
            }

            // Replace the placeholder with actual data
            const renderedHtml = data.replace('{{#each pages}}', pagesArray.map(page => `
                <tr>
                    <td>${page.url}</td>
                    <td>${page.count}</td>
                </tr>
            `).join(''));
            res.send(renderedHtml);
        });
    });

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

main();
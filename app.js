const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

async function findUrlsWithKeyword(url, keyword) {
    const visitedLinks = new Set();
    const matchedUrls = [];

    async function searchInPage(url) {
        if (visitedLinks.has(url) || matchedUrls.length >= 10) {
            return;
        }
        visitedLinks.add(url);

        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            const anchorTags = $('a[href]');

            anchorTags.each((index, element) => {
                const text = $(element).text();
                const link = $(element).attr('href');
                if (text.toLowerCase().includes(keyword.toLowerCase())) {
                    const fullLink = new URL(link, url).href;
                    matchedUrls.push(fullLink);
                    if (matchedUrls.length >= 10) {
                        return false;
                    }
                    searchInPage(fullLink);
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    await searchInPage(url);
    return matchedUrls;
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/extract', async (req, res) => {
    const { websiteUrl, keyword } = req.body;
    const matchedUrls = await findUrlsWithKeyword(websiteUrl, keyword);
    res.send({ urls: matchedUrls, keyword });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

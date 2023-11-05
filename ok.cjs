const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();


  await page.goto('https://www.imdb.com/chart/top/?ref_=nv_mv_250');

  const movies = await page.evaluate(() => {
    const ok = Array.from(document.querySelectorAll('#__next > main > div > div.ipc-page-content-container.ipc-page-content-container--center > section > div > div.ipc-page-grid.ipc-page-grid--bias-left > div > ul > li'))

    return ok.map((mv) => {
      const text = mv.innerText;

      // Getting the individual elements from the string that is the inner text of the HTML

      const array = text.split(/[\n]+/);
      array.pop();

      const ID = array[0].slice(0, array[0].indexOf('.'));
      const name = array[0].slice(array[0].indexOf('.') + 2, array[0].length);
      const releaseDate = array[1];
      const duration = array[2];
      const ratingPG = array[3];
      let rating = array[4] + array[5];
      rating = rating.replace(/\u00A0/, " ");


      const IMDB_link = mv.querySelector('a').href;

      return {
        ID: ID,
        Name: name,
        Release_Date: releaseDate,
        Duration: duration,
        Rating_MPA: ratingPG,
        Rating: rating,
        Page_Link: IMDB_link,
        Recommendations: null,
        Genres: null
      }

    });
  })

  for (let i = 0; i < 5; i++) {
    try {
      await page.goto(movies[i]['Page_Link']);

      const more = await page.evaluate(async () => {
        const delay = async (ms) => new Promise(r => setTimeout(r, ms));

        window.scrollBy(50, 5000);
        await delay(4000);

        const genreUnparsed = document.querySelector('[data-testid=storyline-genres]').querySelector('[role=presentation]').innerText;
        const genre = genreUnparsed.match(/[A-Z][a-z]+/g);

        const recommendationsArray = Array.from(document.querySelector('[data-testid=MoreLikeThis]').querySelector('[data-testid=shoveler-items-container]').querySelectorAll('[role=group]'));

        let recommendations = [];

        for (let j = 0; j < recommendationsArray.length; j = j + 2) {
          recommendations.push(recommendationsArray[j].innerText.split(/[\n]+/)[1]);
        }

        const cap = [genre, recommendations];

        return cap;

      })

      movies[i]["Genres"] = more[0];
      movies[i]["Recommendations"] = more[1];
    }
    catch (err) {
      console.log(err);
    }

  }

  await browser.close();

  fs.writeFile('date.json', JSON.stringify(movies, null, 2), 'utf-8', () => {
    console.log("Done.");
  });
})();


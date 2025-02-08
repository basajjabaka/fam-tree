const puppeteer = require("puppeteer");

/**
 * Extract latitude and longitude from a Google Maps link
 * @param {string} link - Google Maps link
 * @returns {Promise<{lat: number, lng: number}>} Parsed latitude and longitude
 */
async function extractLatLngFromLink(link) {
  const latLngRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/; // Matches @lat,lng
  const placeRegex = /place\/(.*?)(-?\d+\.\d+),(-?\d+\.\d+)/; // Matches /place/ with optional place name before coordinates
  const queryRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/; // Matches?q=lat,lng
  const searchRegex = /search\/(-?\d+\.\d+),\s*(-?\d+\.\d+)/; // Matches /search/lat,lng
  const paramRegex = /([-+]?\d*\.\d+),([-+]?\d*\.\d+)(?=\s*(?:[?&]|$))/; // Matches lat,lng even with params after it

  try {
    let url = link;

    // Resolve the link if it doesn't contain lat/lng
    if (
      !latLngRegex.test(link) &&
      !placeRegex.test(link) &&
      !queryRegex.test(link) &&
      !searchRegex.test(link)
    ) {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(link, { waitUntil: "networkidle2" });
      url = page.url();
      await browser.close();
    }

    const match =
      latLngRegex.exec(url) ||
      placeRegex.exec(url) ||
      queryRegex.exec(url) ||
      searchRegex.exec(url) ||
      paramRegex.exec(url); // Adding support for coordinates in query parameters

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      return { lng, lat };
    } else {
      throw new Error("Latitude and longitude not found in the link");
    }
  } catch (err) {
    throw new Error(`Failed to extract lat/lng: ${err.message}`);
  }
}

module.exports = extractLatLngFromLink;

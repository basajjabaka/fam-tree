// Import node-fetch using dynamic import
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();

/**
 * Follow redirects to get the final URL
 * @param {string} url - Initial URL
 * @returns {Promise<string>} Final URL after redirects
 */
async function getExpandedUrl(url) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      follow: 5, // Maximum redirects to follow
    });
    return response.url;
  } catch (error) {
    throw new Error(`Failed to expand shortened URL: ${error.message}`);
  }
}

/**
 * Extract latitude and longitude from a Google Maps link using Google Maps API
 * @param {string} link - Google Maps link
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<{lat: number, lng: number}>} Parsed latitude and longitude
 */
async function extractLatLngFromLink(link) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Expand shortened URL if necessary
  const expandedLink = link.includes('goo.gl') ? await getExpandedUrl(link) : link;

  const latLngRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const placeRegex = /\/place\/.*?@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const queryRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const paramRegex = /([-+]?\d+\.\d+),([-+]?\d+\.\d+)/;

  try {
    const url = new URL(expandedLink);
    let match;

    // Check for direct coordinate matches in URL
    if ((match = latLngRegex.exec(url.href))) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    if ((match = placeRegex.exec(url.href))) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    if ((match = queryRegex.exec(url.href))) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    if ((match = paramRegex.exec(url.href))) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // Extract place ID or name if no coordinates found
    const placeId = extractPlaceId(url);
    if (placeId) {
      const details = await getPlaceDetails(placeId, apiKey);
      return details.geometry.location;
    }

    // If we can't find coordinates or place ID, try to extract from the URL path
    const urlPath = url.pathname + url.search;
    const coordinates = extractCoordinatesFromPath(urlPath);
    if (coordinates) {
      return coordinates;
    }

    // Last resort: try geocoding the place name
    const placeName = extractPlaceName(url);
    if (!placeName) {
      throw new Error('No valid location information found in URL');
    }

    if (!apiKey) {
      throw new Error('Google Maps API key is required for geocoding');
    }

    const geocode = await geocodeAddress(placeName, apiKey);
    return geocode.results[0].geometry.location;
  } catch (err) {
    console.error('Error details:', err);
    throw new Error(`Failed to extract coordinates: ${err.message}`);
  }
}

function extractCoordinatesFromPath(path) {
  // Look for numbers that could be coordinates in the path
  const coords = path.match(/[-+]?\d*\.\d+|\d+/g);
  if (coords && coords.length >= 2) {
    const possibleLat = parseFloat(coords[0]);
    const possibleLng = parseFloat(coords[1]);
    
    // Basic validation of coordinates
    if (isValidLatitude(possibleLat) && isValidLongitude(possibleLng)) {
      return { lat: possibleLat, lng: possibleLng };
    }
  }
  return null;
}

function isValidLatitude(lat) {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lng) {
  return lng >= -180 && lng <= 180;
}

// Helper functions remain the same
function extractPlaceId(url) {
  const params = url.searchParams;
  const qParam = params.get("q");

  if (qParam && qParam.startsWith("place_id:")) {
    return qParam.split(":")[1];
  }

  const pathParts = url.pathname.split("/");
  const placeIndex = pathParts.indexOf("place");

  if (placeIndex !== -1 && pathParts[placeIndex + 1]?.startsWith("place_id:")) {
    return pathParts[placeIndex + 1].split(":")[1];
  }

  return null;
}

function extractPlaceName(url) {
  const params = url.searchParams;
  const queryParam = params.get("query") || params.get("q");
  if (queryParam) return decodeURIComponent(queryParam);

  const pathParts = url.pathname.split("/");
  const placeIndex = pathParts.indexOf("place");

  if (placeIndex !== -1 && pathParts[placeIndex + 1]) {
    return decodeURIComponent(pathParts[placeIndex + 1].replace(/\+/g, " "));
  }

  return decodeURIComponent(url.pathname.replace(/\+/g, " "));
}

async function getPlaceDetails(placeId, apiKey) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=geometry`
  );
  const data = await response.json();

  if (data.status === "OK") return data.result;
  throw new Error("Place details not found");
}

async function geocodeAddress(address, apiKey) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`
  );
  const data = await response.json();

  if (data.status === "OK") return data;
  throw new Error("Geocoding failed");
}

module.exports = extractLatLngFromLink;
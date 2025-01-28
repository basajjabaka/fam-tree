const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

async function calculateRoadDistance(lat1, lon1, lat2, lon2) {
  const apiKey = process.env.OLA_MAPS_API_KEY;
  const url = `https://api.olamaps.io/routing/v1/distanceMatrix/basic?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&api_key=${apiKey}`;
  const requestId = uuidv4();

  try {
    const response = await axios.get(url, {
      headers: {
        "X-Request-Id": requestId,
      },
    });
    const data = response.data;

    if (data.status === "SUCCESS") {
      const element = data.rows[0].elements[0];
      if (element.status === "OK") {
        const distance = element.distance / 1000; // Convert meters to kilometers
        return distance;
      } else {
        throw new Error(`Error from API: ${element.status}`);
      }
    } else {
      throw new Error(`Error from API: ${data.status}`);
    }
  } catch (error) {
    throw new Error(`Failed to calculate road distance: ${error.message}`);
  }
}

module.exports = calculateRoadDistance;

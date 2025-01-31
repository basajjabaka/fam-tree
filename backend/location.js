const axios = require("axios");

async function calculateRoadDistance(lat1, lon1, lat2, lon2) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Your Google Maps API key
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lon1}&destination=${lat2},${lon2}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "OK") {
      const distanceValue = data.routes[0].legs[0].distance.value; // Distance in meters

      const distanceInKm = distanceValue / 1000; // Convert meters to kilometers

      return distanceInKm;
    } else {
      throw new Error(`Error from Google Maps API: ${data.status}`);
    }
  } catch (error) {
    throw new Error(`Failed to calculate road distance: ${error.message}`);
  }
}

module.exports = calculateRoadDistance;

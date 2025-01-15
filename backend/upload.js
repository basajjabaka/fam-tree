require("dotenv").config();

exports.handler = async (event, context) => {
  try {
    const fetch = (await import("node-fetch")).default;
    const { fileName, fileType } = JSON.parse(event.body);
    const response = await fetch(
      `${process.env.NETLIFY_BLOB_URL}/.netlify/functions/blob`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NETLIFY_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          operation: "create",
          path: fileName,
          contentType: fileType,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to create blob");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl: data.upload_url, blobUrl: data.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

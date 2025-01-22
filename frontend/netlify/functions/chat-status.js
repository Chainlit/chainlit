exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://chatx01.netlify.app",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    },
    body: JSON.stringify({
      status: "online",
      site: "chatx01",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      features: {
        chat: true,
        streaming: true,
        fileUpload: true
      }
    })
  };
}
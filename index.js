const express = require("express");
const app = express();
const port = 8888;
const { addUrlToQueue } = require("./getHtml");

// Add middleware to parse JSON bodies
app.use(express.json());

app.post("/", (req, res) => {
  const url = req.body.url;
  const callbackUrl = req.body.callbackUrl;
  const waitKey = req.body.waitKey;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  addUrlToQueue(url, callbackUrl, waitKey);
  res.json({ message: "Url added to queue", waitKey: waitKey });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

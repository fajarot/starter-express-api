import express from "express";
import cors from "cors";

import route from "./routes/index.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api", route);

app.use(function (req, res, next) {
  res.status(404);

  res.format({
    html: function () {
      // res.render("404", { url: req.url });
      res.send("<h1>Page not found on the server</h1>");
    },
    json: function () {
      res.json({ error: "Not found" });
    },
    default: function () {
      res.type("txt").send("Not found");
    },
  });
});

app.listen(port, () =>
  console.log("Server started at http://localhost:" + port)
);

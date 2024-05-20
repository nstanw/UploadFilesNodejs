const express = require("express");
const fs = require('fs');
const path = require("path");
const app = express();
const multer = require("multer");
const includeMulter = multer().any();
require("./util/readenv").config();
let open;

const os = require("os");
const networkInterfaces = os.networkInterfaces();

  for (let interface in networkInterfaces) {
    for (let interfaceInfo of networkInterfaces[interface]) {
      if (interfaceInfo.family === "IPv4" && !interfaceInfo.internal) {
        var ip = "http://" + interfaceInfo.address + ":" + process.env.PORT;
        console.log(ip);
      }
    }
  }



// app.use(multer().any());
function shouldParseRequest(req) {
  const currentMethod = req.method;
  const currentRoute = req.originalUrl;

  const restrictedRoutes = [
    {
      method: "POST",
      originalUrl: "/",
    },
  ];

  for (var i = 0; i < restrictedRoutes.length; i++) {
    if (
      restrictedRoutes[i].method == currentMethod &&
      restrictedRoutes[i].originalUrl == currentRoute
    ) {
      return false;
    }
  }
  return true;
}

app.use(function (req, res, next) {
  shouldParseRequest(req) ? includeMulter(req, res, next) : next();
});

app.use(express.static("public"));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/get-uploads', function(req, res) {
  fs.readdir(path.join(__dirname, 'uploads'), function(err, files) {
    if (err) {
      res.status(500).send('Error reading files');
    } else {
      res.json(files);
    }
  });
});

const routes = require("./routes/");


app.get('/api/interface-address', function(req, res) {
  res.json({ interfaceAddress: ip });
});

app.use("/", routes);



app.listen(process.env.PORT, async function () {
  // redirect tới ip
  const module = await import('open');
  open = module.default;
  open(ip);
  console.log("Server is listening at the port", process.env.PORT);
});

module.exports.app = app;

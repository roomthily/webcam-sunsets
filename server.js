// server.js
// where your -ydobnode app starts

// init project
var express = require('express');
var app = express();
var jimp = require('jimp'),
    multer = require('multer'),
    bodyparser = require('body-parser'),
    fs = require('fs'),
    spatialnoise = require('spatial-noise');

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));


// app.use(bodyparser.urlencoded({ extended: true }));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// for local tests
// curl -X POST -F "image=@Documents/screenshots/fre.jpg" https://webcam-sunsets.glitch.me/glitch; echo
// note that postman doesnot manage single uploads
// as expected and so BORK

// curl -X POST -F "image=@Documents/screenshots/longs_peak_partial.jpg" https://webcam-sunsets.glitch.me/glitch > Documents/screenshots/generated.jpg; echo
const upload = multer({dest: '/tmp/'});
app.post("/glitch", upload.single('image'), (request, response) => {

  // console.log(request);
  console.log('file', request.file);
  
  var f = request.file.path;  //+ '/' + request.file.filename;
  
  console.log('uploaded file: ', f, fs.existsSync(f));
  
//   fs.readdir('/tmp', (err, files) => {
//     console.log('temp files:', files);
//   });
  
  // load file into jimp
  jimp.read(request.file.path)
  .then(img => {
    // monkey with it
    // a) darker
    // b) add rgb noise pixels
    //
    // where darker progresses
    // and the number of noise pixels increases
    // until mostly black, when they decrease again
    img.color([
      { apply: 'shade', params: [ 30 ]}
    ]);
    
    // get a random surface, width..height
    // and set a cut-off for not many pixels,
    // more pixels, more pixels, many more pixels, 
    // mostly pixels, it's black now so some pixels,
    // and totally black so a few pixels
    var grid = [];
    var width = img.bitmap.width;
    var height = img.bitmap.height;
    for (var i = 0; i < width; i++) {
      var row = [];
      for (var j = 0; j < height; j++) {
        
      }
      grid.push(row);
    }

    
    var mime = jimp.MIME_JPEG;
    img.getBuffer(mime, (err, buffer) => {
      if (err) {
        console.log('img error: ', err);
        response.send();
      }
      
      response.setHeader('Content-disposition', 'inline;attachment; filename=generated.jpg');
      response.setHeader('Content-type', mime);
      response.send(buffer);
    });
  })
  .catch(err => {
    console.log('jimp error: ', err);
    response.send('');
  });
});


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

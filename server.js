// server.js
// where your -ydobnode app starts

// init project
var express = require('express');
var app = express();
var jimp = require('jimp'),
    multer = require('multer'),
    bodyparser = require('body-parser'),
    fs = require('fs'),
    random = require('random-js'),
    encoder = require('gif-encoder');

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.use('/gifs', express.static('/tmp'))

const upload = multer({dest: '/tmp/'});

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// for local tests
// curl -X POST -F "image=@Documents/screenshots/fre.jpg" https://webcam-sunsets.glitch.me/glitch; echo
// note that postman doesnot manage single uploads
// as expected and so BORK

// curl -X POST -F "image=@Documents/screenshots/longs_peak_partial.jpg" https://webcam-sunsets.glitch.me/glitch > Documents/screenshots/generated.jpg; echo

const engine = random.engines.mt19937().autoSeed();



app.post("/glitch", upload.single('image'), (request, response) => {
  console.log('file', request.file);
  
  var f = request.file.path;  //+ '/' + request.file.filename;
  
  console.log('uploaded file: ', f, fs.existsSync(f));
  
  request.setTimeout(0);
  
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
    
    // get a random surface, width..height
    // and set a cut-off for not many pixels,
    // more pixels, more pixels, many more pixels, 
    // mostly pixels, it's black now so some pixels,
    // and totally black so a few pixels
    
    img.resize(Math.floor(img.bitmap.width/2), jimp.AUTO, jimp.RESIZE_BEZIER);
    
    console.log(img.bitmap.width, 'x', img.bitmap.height);
    
    var width = img.bitmap.width;
    var height = img.bitmap.height;
    
    // a rough guide to how many pixels to bork
    // as a proportion, 0-1
    var pixel_points = [0.005, 0.01, 0.05, 0.1, 0.35, 0.55, 0.7, 0.9, 0.05, 0.01];

    
    // so for anything less than the breakpoint switch the pixel to
    // r || g || b || white
    // and overloading the white a bit
    var colors = [0x4278190081, 0x16711681, 0x65281, 0x4294967041, 0x4294967041, 0x4294967041, 0x4294967041, 0x4294967041, 0x4294967041];
    var hdistro = random.integer(0, height);
    var wdistro = random.integer(0, width);
    
    // TODO: set up the encoder
    var gif_fn = '/tmp/' + random.uuid4(engine) + '.gif';
    console.log('FILENAME: ', gif_fn);
    var gif = new encoder(width, height);
    gif.setRepeat(0);
    gif.setFrameRate(2);
    var output = fs.createWriteStream(gif_fn);
    gif.pipe(output);
    gif.writeHeader();
    
    for (var i = 0; i < pixel_points.length; i++) {
      // clone the image, do things, push to gif bin
      var copy = img.clone();
      copy.color([
        { apply: 'shade', params: [ (i+1)*10 ]}
      ]);
      for (var v=0; v < Math.ceil(pixel_points[i]*width*height); v++) {
        var color = random.pick(engine, colors);
        copy.setPixelColor(color, wdistro(engine), hdistro(engine));
      }
      
      // then convert the img 2d to rgba 1d as rgba*w*h
      var pickles = [];
      copy.scan(0, 0, width, height, function(x, y, idx) {        
        pickles.push(this.bitmap.data[idx+0]);
        pickles.push(this.bitmap.data[idx+1]);
        pickles.push(this.bitmap.data[idx+2]);
        pickles.push(this.bitmap.data[idx+3]);
      });
      // add pickles frame
      gif.addFrame(pickles);
      
      // to try to avoid the memory limit
      // (no idea what that limit is)
      gif.on('readable', function () {
        console.log(gif.read());
      });
    }
    
    gif.finish();
    
    response.setHeader('Content-type', 'image/gif');
    response.setHeader('Content-disposition', 'inline;attachment; filename=generated.gif');
    
    // now pipe the gif file to the response
    var read = fs.createReadStream(gif_fn);
    read.on('close', () => {
      response.end();
    });
    read.pipe(response);

    
//     var mime = jimp.MIME_JPEG;
//     img.getBuffer(mime, (err, buffer) => {
//       if (err) {
//         console.log('img error: ', err);
//         response.send();
//       }
      
//       response.setHeader('Content-disposition', 'inline;attachment; filename=generated.jpg');
//       response.setHeader('Content-type', mime);
//       response.send(buffer);
//     });
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

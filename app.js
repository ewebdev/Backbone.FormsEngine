var express = require('express')
	, http = require('http')
	, path = require('path')
	, fs = require('fs');

var app = express();

app.configure(function () {
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(require('connect-coffee-script')({
		src: __dirname + '/assets',
		bare: true
	}));
	app.use(require('less-middleware')({ src: __dirname + '/assets' }));
	app.use(express.static(path.join(__dirname, 'assets')));
});

app.configure('development', function () {
	app.use(express.errorHandler());
});


app.get('/', function (req, res) {
	res.render('index', { title: 'Express' });
});

app.get('/config-examples/:filename', function (req, res) {
	var filename = req.params.filename;
	fs.readFile('./assets/config-examples/' + filename, function (err, data) {
		if (err) {
			res.send(500);
		} else {
			res.send(data.toString());
		}
	});
});

http.createServer(app).listen(app.get('port'), function () {
	console.log("Express server listening on port " + app.get('port'));
});



(function () {
	// build script
	var srcFiles = [
        './assets/js/formsEngine/src/00.header.js',
        './assets/js/formsEngine/src/01.underscore.mixin.deepExtend.js',
        './assets/js/formsEngine/src/02.chosen.jquery.js',
        './assets/js/formsEngine/src/02.deep-model.js',
		'./assets/js/formsEngine/src/03.validation.js',
		'./assets/js/formsEngine/src/04.namespace.js',
		'./assets/js/formsEngine/src/05.fieldTypes.js',
		'./assets/js/formsEngine/src/06.core.js'
	];
	var appendFile = function (files, concatSrc, callback) {
		var fname = files.shift();
		if (fname) {
			fs.readFile(fname, function (err, data) {
				if (err) {
					console.log('err');
				} else {
					concatSrc.push(data.toString());
					appendFile(files, concatSrc, callback);
				}
			});
		} else {
			callback && callback(concatSrc);
		}
	};
	var concatenated = ['(function(){'];
	appendFile(srcFiles, concatenated, function (src) {
		src.push('})();');
		var text = src.join("\n");
		fs.writeFile('./assets/js/formsEngine/build/formsEngine.js', text);
		console.log('Successfully built formsEngine.js');
	});
})();

(function () {
	// build css
	var srcFiles = [
		'./assets/css/formsEngine/src/chosen.css',
		'./assets/css/formsEngine/src/styles.css'
	];
	var appendFile = function (files, concatSrc, callback) {
		var fname = files.shift();
		if (fname) {
			fs.readFile(fname, function (err, data) {
				if (err) {
					console.log('err');
				} else {
					concatSrc.push(data.toString());
					appendFile(files, concatSrc, callback);
				}
			});
		} else {
			callback && callback(concatSrc);
		}
	};
	var concatenated = [];
	appendFile(srcFiles, concatenated, function (src) {
		var text = src.join("\n");
		fs.writeFile('./assets/css/formsEngine/build/formsEngine.css', text);
		console.log('Successfully built formsEngine.css');
	});
})();

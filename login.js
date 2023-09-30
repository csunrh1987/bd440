const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

const port = 3000;


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));


const conn = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "root",
	port:8889,
	database: "signupform"
	
	
});

conn.connect( (err) => {
	if (err) throw err;
	console.log("Connected");
});

app.get('/update', (req, res) =>{
	let username = req.session.username;
	conn.query('SELECT count FROM registration WHERE username=?', [username],
	function(error, results, field){
		if(error) throw error;
		let writeme = results[0].count
		conn.query('UPDATE registration SET count = (count + 1) WHERE username=?', [username],
			function(error, count, field){
				if(error) throw error;
				res.status(200).json({info: writeme});
		});
		
	});
});
app.get('/', (req, res) =>{
	res.sendFile("main.html", {root:__dirname});

});
	
	
	
	
	
	
	
	//res.status(200).json({info: 'hey'});


app.get('/signup', (req, res) => {
	res.sendFile("signup.html", {root:__dirname});
});

app.get('/login', (req, res) => {
	res.sendFile("login.html", {root:__dirname});	
});




app.get('/landing', (req, res) => {
	if(req.session.loggedin){
		res.sendFile("landing.html", {root:__dirname});
	}
	else{
		res.send("Landing wrong");
	}
	
});

//button increase
/*app.post('/update', (req, res) => {
	let username = req.session.username;
	conn.query('SELECT count FROM registration WHERE username=?', [username],
	function(error, results, field){
		if(error) throw error;
		res.write(results[0].count);
		res.end();
		
		/*conn.query('UPDATE registration SET count = (count + 1) WHERE username=?', [username],
			function(error, count, field){	
		});
		
	});
});*/


//signup authorization
app.post('/create', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	let email = req.body.email;
	let confirm_email = req.body.confirmemail;
	let count = 0;

	
	conn.query('SELECT * FROM registration WHERE username=? OR email=?', [username, email],
	function(error, results, field){
		if(error) throw error;
		if(!results.length){
			conn.query('INSERT INTO registration (username,password, count, email) VALUES(?,?,?,?)', [username, password, count, email], function (err, result, fields){
				if(error) throw error;
			});
			res.send("User created");
		}
		else{
			res.send("<h1>User already exists! </h1><a href='/signup'>Click to go back</a>");
			
		}
		res.end();
	});
});


//login authorization
app.post('/auth', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	/*if(username && password)
		res.send("Worked :)");
	else
		res.send("WTF");*/
	
	
	if(username && password){
		conn.query('SELECT * FROM registration WHERE username= ? and password= ?', [username, password], 
		function(error, results, fields){
			if(error) throw error;
			if(results.length>0){
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/landing');
			}
			else{
				res.send("wrong.");
			}
			res.end();

		});
	}
	else{
		res.send("<h1>Empty?</h1><a href='/'>Click to go back</a>");
		res.end();
	}		
});


app.listen(port);



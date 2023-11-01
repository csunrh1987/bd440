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

//signup authorization
app.post('/create', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
	let email = req.body.email;
	let confirm_email = req.body.confirmemail;

	
	conn.query('SELECT * FROM registration WHERE username=? OR email=?', [username, email],
	function(error, results, field){
		if(error) throw error;
		if(!results.length){
			conn.query('INSERT INTO registration (username,password, email) VALUES(?,?,?)', [username, password, email], function (err, result, fields){
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

//creating a table
app.post('/createtable', (req, res)=> {
	
	var sql = 'DROP TABLE IF EXISTS signupform.useritem;'
	conn.query(sql, function(err, result){
		if (err) throw err;
		var sql2 = 'CREATE TABLE signupform.useritem ( user_id INT(255), FOREIGN KEY (user_id) REFERENCES registration(id), title VARCHAR(255) NOT NULL , description VARCHAR(255) NOT NULL , category VARCHAR(255) NOT NULL , price INT(255) NOT NULL , item_id INT(255) NOT NULL AUTO_INCREMENT , PRIMARY KEY (item_id)) ENGINE = InnoDB;'
		conn.query(sql2, function(err, result){
			if (err) throw err;
			res.send("Success");
			})
	})
});


app.listen(port);


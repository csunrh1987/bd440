const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

const port = 3000;
global.globalusername = "Sample";


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

function makeDate(){
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	return year + "-" + month + "-" + date;
}


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


app.post('/additem', (req, res) => {
	var userid;
	let title = req.body.intitle;
	let descip = req.body.indescription;
	let cat = req.body.incategory;
	let pric = req.body.inprice;
	let currentdate = makeDate();
	
	let username = req.session.username;
	conn.query('SELECT id FROM registration WHERE username=?', [username],
	function(err, result, field){
			if (err) throw err;
			var data=JSON.parse(JSON.stringify(result));
			userid = (data[0].id);

			var sql = 'CALL CreateItem(?,?,?,?,?,?)'
			conn.query(sql, [userid, title, descip, cat, pric, currentdate], 
				function(err, result) {
					if (err) throw err;
					var data=JSON.parse(JSON.stringify(result));
					if(typeof data[1] !== 'undefined')
						res.send("Max number of inserts reached. </h1><a href='/landing'>Click to go back</a>");
					else
						res.send("Inserted sucessfully. </h1><a href='/landing'>Click to go back</a>");
			});
	});

	
});

//creating a table
app.post('/createtable', (req, res)=> {
	let currentdate = makeDate();
	var sql = 'CALL CreateTable(?)'
	conn.query(sql, [currentdate], function(err, result){
		if (err) throw err;
		res.send("Table Created. </h1><a href='/landing'>Click to go back</a>");
	});
});

//Search and display items in a category
app.post('/searchcategory', (req, res) => {
    const category = req.body.category;
	
    conn.query("SELECT title, category FROM signupform.useritem WHERE category = ?", [category], (error, results) => {
        if (error) throw error;
		console.log(results);
        const items = results.map(result => ({
            title: result.title,
            category: result.category,
        }));

        res.json(items); // Send the results as JSON
    });
});


app.listen(port);


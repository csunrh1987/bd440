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
		console.log(category);
        res.json(items); // Send the results as JSON
    });
});

// Handle the review submission
app.post('/submitreview', (req, res) => {
	const { item_id, rating, reviewText } = req.body;
	const username = req.session.username;
	const today = makeDate();

	// Check if the user has already submitted three reviews today
	conn.query('SELECT COUNT(*) AS reviewCount FROM reviews WHERE reviewer = ? AND date = ?', [username, today], (err, result) => {
		if (err) {
			return res.status(500).send(err);
		}

		const data = JSON.parse(JSON.stringify(result));
		const reviewCountToday = data[0].reviewCount;

		if (reviewCountToday >= 3) {
			return res.status(403).send('You have already submitted three reviews today.');
		}

		// Check if the user is the creator of the item
		conn.query('SELECT user_id FROM useritem WHERE item_id = ?', [item_id], (err, result) => {
			if (err) {
				return res.status(500).send(err);
			}

			const itemData = JSON.parse(JSON.stringify(result));
			const itemOwner = itemData[0].user_id;

			if (itemOwner === username) {
				return res.status(403).send("You can't review your own item.");
			}

			// Insert the review into the database
			const sql = 'INSERT INTO reviews (item_id, rating, review_text, reviewer, date) VALUES (?, ?, ?, ?, ?)';
			conn.query(sql, [item_id, rating, reviewText, username, today], (err, result) => {
				if (err) {
					return res.status(500).send(err);
				}
				console.log('Review added to the database.');
				return res.status(200).send('Review added to the database.');
			});
		});
	});
});





// Creating a review table
app.post('/createReviewTable', (req, res) => {
	const sql = 'CREATE TABLE IF NOT EXISTS reviews (id INT AUTO_INCREMENT PRIMARY KEY, item_id INT, rating INT, review_text TEXT, reviewer VARCHAR(255), date DATE)';
	conn.query(sql, (err, result) => {
		if (err) {
			console.error('Error occurred while creating table:', err);
			return res.status(500).send('An error occurred while creating the table.');
		}
		console.log('Reviews table created.');
		return res.status(200).send('Reviews table created.');
	});
});

//query 1 phase 3
app.get('/maxcat', (req, res) => {
	const sql = 'SELECT category, MAX(price) as max FROM useritem GROUP BY category';
	conn.query(sql, (err,result) => {
		if (err) throw err;
		const items = result.map(result => ({
			category: result.category,
			max: result.max,
		}));
		console.log(items);
		res.send(items);
		
	});
	



});

//Query 2 phase 3: 2 items on same day but in a different category
app.post('/searchUsersByCategories', (req, res) => {
	console.log('Received search request:', req.body);
    const category1 = req.body.category1;
    const category2 = req.body.category2;

    const query = `
		SELECT u.username
		FROM registration u
		JOIN useritem i1 ON u.id = i1.user_id
		JOIN useritem i2 ON u.id = i2.user_id
		WHERE i1.category = ? AND i2.category = ? AND i1.datein = i2.datein AND i1.item_id <> i2.item_id
		`;

    conn.query(query, [category1, category2], (error, results) => {
        if (error) {
			console.log('Recieved search request:', req.body);
            console.error('Error in searchUsersByCategories:', error);
            return res.status(500).send('An error occurred while searching for users.');
        }
        console.log('Users:', results.map(result => result.username));
        const users = results.map(result => result.username);
        res.json({ users });
    });
});

//query 3 phase3
app.post('/excellentitems', (req,res) => {
	console.log(req.body.user);
	const myuser = req.body.user;
	
	const sql = 
		'SELECT DISTINCT r.username, r1.item_id, u.title FROM reviews r1 JOIN useritem u ON r1.item_id = u.item_id JOIN registration r ON u.user_id = r.id WHERE r.username = ? AND (r1.review_text = ? OR r1.review_text = ?) AND NOT EXISTS (SELECT 1 FROM reviews r2 WHERE r1.item_id = r2.item_id AND r2.review_text NOT IN(?,?))'
	
	conn.query(sql, [myuser, "Excellent", "Good", "Excellent", "Good"], function (err, result) {
		if (err) throw err;
		const items = result.map(result => ({
			username: result.username,
			title: result.title,
		}));
		console.log("test value:" + myuser);
		res.send(items);
	});
});



app.listen(port);


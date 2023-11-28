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
	let fname = req.body.fname;
	let lname = req.body.lname;
	let confirm_email = req.body.confirmemail;
	console.log(fname);

	
	conn.query('SELECT * FROM registration WHERE username=? OR email=?', [username, email],
	function(error, results, field){
		if(error) throw error;
		if(!results.length){
			conn.query('INSERT INTO registration (username, password, firstName, lastName, email) VALUES(?,?,?,?,?)', [username, password, fname, lname, email], function (err, result, fields){
				if(error) throw error;
			});
			res.send("User created </h1><a href='/signup'>Click to go back</a>");
		}
		else{
			res.send("<h1>User already exists! </h1><a href='/login'>Click to login</a>");
			
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

//creating an item table
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
	console.log('Session user_id:', req.session.user_id); 
	// Check if the user is authenticated
	if (!req.session.username) {
		return res.status(401).send('Unauthorized. Please log in.');
	}

	const { item_id, rating, reviewText } = req.body;
	const reviewer_id = req.session.user_id;
	const today = makeDate();

	// Check if the user has already submitted three reviews today
	conn.query('SELECT COUNT(*) AS reviewCount FROM reviews WHERE reviewer_id = ? AND date = ?', [reviewer_id, today], (err, result) => {
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

			if (itemOwner === reviewer_id) {
				return res.status(403).send("You can't review your own item.");
			}

			// Insert the review into the database
			const sql = 'INSERT INTO reviews (item_id, rating, review_text, reviewer_id, date) VALUES (?, ?, ?, ?, ?)';
			conn.query(sql, [item_id, rating, reviewText, reviewer_id, today], (err, result) => {
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
	const sql = 'CREATE TABLE IF NOT EXISTS reviews (id INT AUTO_INCREMENT PRIMARY KEY, item_id INT, rating VARCHAR(20), review_text TEXT, reviewer_id INT, date DATE)';
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
		'SELECT DISTINCT r.username, r1.item_id, u.title FROM reviews r1 JOIN useritem u ON r1.item_id = u.item_id JOIN registration r ON u.user_id = r.id WHERE r.username = ? AND (r1.rating = ? OR r1.rating = ?) AND NOT EXISTS (SELECT 1 FROM reviews r2 WHERE r1.item_id = r2.item_id AND r2.rating NOT IN(?,?))'
	
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


//Query 4 phase 3
app.post('/mostReviewsOnDate', (req, res) => {
    const targetDate = '2023-09-21'; 

    const query = `
        SELECT r.username, COUNT(rev.id) AS num_reviews
        FROM registration r
        JOIN reviews rev ON r.id = rev.reviewer_id
        WHERE rev.date = ?
        GROUP BY r.username
        HAVING num_reviews = (
            SELECT COUNT(rev.id) AS max_reviews
            FROM reviews rev
            WHERE rev.date = ?
            GROUP BY rev.reviewer_id
            ORDER BY max_reviews DESC
            LIMIT 1
        );
    `;

    conn.query(query, [targetDate, targetDate], (error, results) => {
        if (error) {
            console.error('Error in mostReviewsOnDate:', error);
            return res.status(500).send('An error occurred while fetching users with the most reviews.');
        }

        const users = results.map(result => ({ username: result.username, num_reviews: result.num_reviews }));
        res.json({ users });
    });
});

//Code for favoriting a seller or an item

// Fetch userId for the "favorites" query
const authenticateUser = (req, res, next) => {
    // Check if the user is logged in
    if (!req.session.username) {
        return res.status(401).send('Unauthorized');
    }

    // If the user is logged in, fetch the user_id from the database
    const sql = 'SELECT id FROM registration WHERE username = ?';
    conn.query(sql, [req.session.username], (err, results) => {
        if (err) {
            console.error('Error fetching user_id:', err);
            res.status(500).send('Internal Server Error');
        } else if (results.length > 0) {
            req.session.userId = results[0].id;
            next(); // Continue to the next middleware or route
        } else {
            res.status(401).send('Unauthorized');
        }
    });
};

// Fetch list of sellers
app.get('/sellers', (req, res) => {
    conn.query('SELECT id, username FROM registration', (error, results) => {
        if (error) {
            console.error('Error fetching sellers:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            const sellers = results.map(result => ({ id: result.id, name: result.username }));
            res.json(sellers);
        }
    });
});

// Fetch list of items
app.get('/items', (req, res) => {
    conn.query('SELECT item_id, title FROM useritem', (error, results) => {
        if (error) {
            console.error('Error fetching items:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            const items = results.map(result => ({ id: result.item_id, name: result.title }));
            res.json(items);
        }
    });
});

app.post('/addToFavorites', authenticateUser, (req, res) => {
    const itemId = req.body.id;
    const userId = req.session.userId;
    const favType = req.body.fav_type;

    let idColumnName;

    if (favType === 'item') {
        idColumnName = 'fav_item_id';
    } else if (favType === 'seller') {
        idColumnName = 'fav_seller_id';
    } else {
        return res.status(400).json({ success: false, message: 'Invalid favorite type' });
    }

    const sql = `INSERT INTO favorites (own_user_id, ${idColumnName}, fav_type) VALUES (?, ?, ?)`;
	
	console.log('Selected Seller ID:', itemId);
	
    conn.query(sql, [userId, itemId, favType], (err) => {
        if (err) {
            console.error(`Error adding favorite ${favType}:`, err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        } else {
            console.log(`Added favorite ${favType} for user ${userId}, Item ID: ${itemId}`);
            res.status(200).json({ success: true, message: `Favorite ${favType} added successfully` });
        }
    });
});

// Query 5 phase 3
app.post('/getCommonFavoriteSellers', (req, res) => {
    const user1 = req.body.user1;
    const user2 = req.body.user2;

    const sql = `
        SELECT r1.username AS user1, r2.username AS user2, rCommon.username AS common_fav_seller
        FROM favorites AS f1
        JOIN favorites AS f2 ON f1.fav_seller_id = f2.fav_seller_id
        JOIN registration AS r1 ON f1.own_user_id = r1.id
        JOIN registration AS r2 ON f2.own_user_id = r2.id
        JOIN registration AS rCommon ON f1.fav_seller_id = rCommon.id
        WHERE r1.username = ? AND r2.username = ? AND f1.fav_type = 'seller' AND f2.fav_type = 'seller';
    `;

    conn.query(sql, [user1, user2], (err, results) => {
        if (err) {
            console.error('Error fetching common favorite sellers:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
        }
    });
});


// Query 6 phase 3
app.get('/nonExcellentUsers', (req, res) => {
	const sql = `
        SELECT DISTINCT r.username
        FROM registration r
        WHERE r.username NOT IN (
            SELECT DISTINCT r.username
            FROM reviews rev
            JOIN useritem u ON rev.item_id = u.item_id
            JOIN registration r ON u.user_id = r.id
            WHERE rev.rating = 'Excellent'
            GROUP BY r.username, u.item_id
            HAVING COUNT(DISTINCT rev.reviewer_id) >= 3
        )
    `;

	conn.query(sql, (error, results) => {
		if (error) {
			console.error('Error fetching users with no excellent items:', error);
			res.status(500).json({ error: 'Internal Server Error' });
		} else {
			const users = results.map(result => result.username);
			res.json({ users });
		}
	});
});






//query 7 phase3
app.get('/nopoor', (req, res) =>{
	const sql = 'SELECT DISTINCT G.username FROM registration G, reviews R WHERE G.id = R.reviewer_id AND R.reviewer_id NOT IN (SELECT reviewer_id FROM reviews WHERE rating = ?)'
	conn.query(sql, ["Poor"], function (err, result) {
		if (err) throw err;
		const items = result.map(result => ({
			username: result.username,
		}));
		console.log(items);
		res.send(items);
		})
	
});

//query 8 phase3
app.get('/allpoor', (req, res) =>{
		const sql = 'SELECT DISTINCT G.username, R.rating, G.id FROM registration G, reviews R WHERE G.id = R.reviewer_id AND G.id NOT IN (SELECT R.reviewer_id FROM reviews R WHERE R.rating NOT IN (?))'
		conn.query(sql, ["Poor"], function (err, result) {
		if (err) throw err;
		const items = result.map(result => ({
			username: result.username,
		}));	
		console.log(items);
		res.send(items);
		})
			
});

app.get('/NoPoorReviews', (req, res) => {
	const sql = `
		SELECT G.username, R.item_id AS item, R.rating
		FROM registration G
		LEFT JOIN reviews R ON G.id = R.reviewer_id
		WHERE G.id NOT IN (
			SELECT R.reviewer_id 
			FROM reviews R 
			WHERE R.rating = 'Poor'
		) OR R.rating IS NULL;
	`;

	conn.query(sql, function (err, result) {
		if (err) throw err;

		const items = result.map(result => ({
			username: result.username,
			item: result.item,
			rating: result.rating,
		}));

		console.log(items);
		res.send({ items });
	});
});


//Query 10 Phase 3
// Query for Excellent Review Pairs
//Query 10 Phase 3
// Query for Excellent Review Pairs
app.get('/excellentReviewPairs', (req, res) => {
	const sql = `
        SELECT DISTINCT userA, userB
        FROM (
            SELECT R1.reviewer_id AS userA, R2.reviewer_id AS userB
            FROM reviews R1
            JOIN reviews R2 ON R1.item_id = R2.item_id
            WHERE R1.rating = 'Excellent' AND R2.rating = 'Excellent'
            GROUP BY R1.reviewer_id, R2.reviewer_id
            HAVING COUNT(R1.item_id) = (SELECT COUNT(DISTINCT item_id) FROM reviews WHERE reviewer_id = R1.reviewer_id)
        ) AS excellentReviewPairs
    `;

	conn.query(sql, (error, results) => {
		if (error) {
			console.error('Error fetching excellent review pairs:', error);
			res.status(500).json({ error: 'Internal Server Error' });
		} else {
			const pairs = results.map(result => ({
				userA: result.userA,
				userB: result.userB,
			}));
			res.json({ pairs });
		}
	});
});





app.listen(port);


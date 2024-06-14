#COMP 440 - Course Project: Phase 1 
Fall 2023 

Part 1 (Completed)
Consider the design of a database for an online store. Each item is identified by a unique item ID, a 
title, a description of the item, the date the item is posted, price, and a list of categories (each category 
is a single word in lower cases). Only registered users can post, buy, and review an item. Each registered 
user is identified by a user ID or username (or both), a password, a first name, a last name, and an email 
address. A user can give at most one review for each item, and on a particular day, the user can post at 
most 3 items and 3 reviews. Meanwhile, an item can have no or many reviews. The review given by a 
user provides a score of "Excellent, Good, Fair, or Poor" and then a short remark. A user cannot modify 
an existing review that she/he gave earlier. In addition, each user has two dynamic lists: my favorite 
sellers and my favorite items, which can be modified by the user when necessary, by insert, delete or 
update. 
Some simple GUI interfaces are required for each functionality.

Part 2 (Completed)

Based on part 1, implement the following functionality using your selected programing language and 
SQL with necessary GUI interfaces. Part 2 emphasizes the programming of interfaces and design and 
their integration with database operations.  
1. Implement a interface so that a user can insert an item, such as:  
  Title: Smartphone 
  Description: This is the new iPhone X  
  Category: electronic, cellphone, apple 
  Price: 1000 
  The IDs of items should be generated automatically using autoincrement feature of MySQL. 
  Make sure that a user can only post 3 items a day. 
2. Implement a search interface as a form so that after one type in a category, all the 
items with that category are returned. The result needs to be shown as a table/list on a page. 
3. Select an item from the above list, and one can write a review like the following:  
  A dropdown menu to choose "excellent/good/fair/poor", and then a description such as    
  "This is a cool phone.".
  Make sure that a user can give at most 3 reviews a day and cannot give a review to his own 
  items. 
4. Implement a button called "Initialize Database." When a user clicks it, all 
necessary tables will be created (or recreated) automatically. Each table will be populated with at 
least 5 tuples so that each query below will return some results

Part 3 (Completed)

Based on parts 1 & 2, implement the following functionality using your selected programing language 
and SQL with necessary GUI interfaces. Part 3 emphasizes both the interfaces and their integration 
with backend database operations. Each item has 6.5 points. 
1. List the most expensive items in each category. 
2. List the users who posted at least two items that were posted on the same day, one has a category 
of X, and another has a category of Y. In terms of the user interface, you will implement two 
text fields so that you can input one category into each text field, and the search will return the 
user (or users) who (the same user) posted two different items on the same day, such that one 
item has a category in the first text field and the other has a category in the second text field.
3. List all the items posted by user X, such that all the comments are "Excellent" or "good" for 
these items (in other words, these items must have comments, but these items don't have any 
other kinds of comments, such as "bad" or "fair" comments). User X is arbitrary and will be 
determined by the instructor. 
4. List the users who posted the most number of items on a specific date like 5/1/2023; if there is 
a tie, list all the users who have a tie. The specific date can be hard coded into your SQL select 
query or given by the user. 
5. List the other users who are favorited by both users X, and Y. Usernames X and Y will be 
selected from dropdown menus by the instructor. In other words, the user (or users) C are the 
favorite for both X and Y. 
6.   Display all the users who never posted any "excellent" items: an item is excellent if at least 
three reviews are excellent.  
7.   Display all the users who never posted a "poor" review. 
8.   Display all the users who posted some reviews, but each of them is "poor". 
9.   Display those users such that each item they posted so far never received any "poor" reviews. 
In other words, these users must have posted some items; however, these items have never 
received any poor reviews or have not received any reviews at all
10. List a user pair (A, B) such that they always gave each other "excellent" reviews for every single 
item they posted.  

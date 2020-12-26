import sqlite3


conn = sqlite3.connect('Orders.db')
# c = conn.cursor()
# c.execute("""CREATE TABLE table_1 (
#     orders text
#     )""")
# conn.commit()
# conn.close()

c = conn.cursor()
c.execute("""CREATE TABLE table_2 (
    orders text
    )""")
conn.commit()
conn.close()

# #Conncet to Database
# c = conn.cursor()

#Query the database
# c.execute("SELECT * FROM customers")

#Fetchs all information from the database
#print(c.fetchall())

#Fetchs the index of the database
#print(c.fetchone()[1])

#Fetchs the amount of inserts you send in the parethsis
#print(c.fetchmany(2))

#Crete a variable, store all data in database to it, list out data
# items= c.fetchall()
# for item in items:
#     print(item)

#Prints out all the info of the index ofdata you ask for in database
# items= c.fetchall()
# for item in items:
#     print(item[0])

#Prints the database out with spaces. Nice format
# items= c.fetchall()
# for item in items:
#     print(item[0] + "-" + item[1] + "\t" + item[2])

#Prints out the id of all data in database as well as the data
# c.execute("SELECT rowid, * FROM customers")
#
# items = c.fetchall()
# for item in items:
#     print(item)

#--This code below does not work but shows capability
#If you have numbers stored you can use operators to find certain vaules in ranges
# c.execute("SELECT * FROM customers WHERE age >= 12")

#Querys the database for any last name that have Elder in it
# c.execute("SELECT * FROM customers WHERE last_name = 'Elder'")
# items = c.fetchall()
# for item in items:
#     print(item)


#Querys lastname to se if anything is in it starting with 'Br'
# c.execute("SELECT * FROM customers WHERE last_name LIKE 'Br%'")
# items = c.fetchall()
# for item in items:
#     print(item)


#Querys email to se if anything ends in '.com'
# c.execute("SELECT * FROM customers WHERE email LIKE '%.com'")
# items = c.fetchall()
# for item in items:
#     print(item)

#-------Update records----------------

# c.execute("""UPDATE customers SET first_name = 'BOB'
#             WHERE last_name = 'Elder'""")
# conn.commit()
#
# c.execute("SELECT rowid, * FROM customers")
# items = c.fetchall()
# for item in items:
#     print(item)


#-----------Delete Record-----------
# c.execute("DELETE from customers WHERE rowid = 3")
# conn.commit()
# c.execute("SELECT rowid, * FROM customers")
# items = c.fetchall()
# for item in items:
#     print(item)


#--------------Return in order of ...--------------
#Returns everything in database in desending order of index
# c.execute("SELECT rowid, * FROM customers ORDER BY rowid DESC")
# items = c.fetchall()
# for item in items:
#     print(item)
#
# c.execute("SELECT rowid, * FROM customers ORDER BY last_name DESC")
# items = c.fetchall()
# for item in items:
#     print(item)


#---------------And-Or-------------------
#You can change the OR to AND


# many_customers = [('Wes','Brown', 'Wesbrown@.com'),
#                   ('John','Blue', 'Tsbrown@.com'),
#                   ('Barry','Green', 'ILsbrown@.com')]
# c.executemany("INSERT INTO customers VALUES (?, ?, ?)",many_customers)
# conn.commit()
#c.execute("SELECT rowid, * FROM customers WHERE last_name LIKE 'BR%' OR rowid = 3")
# c.execute("SELECT rowid, * FROM customers")
# items = c.fetchall()
# for item in items:
#     print(item)

#----------------Delete a tabel---------------
#Deltes a table and cretes the same table again

# c.execute("DROP TABLE customers")
# conn.commit()


# c.execute("""CREATE TABLE customers (
#     first_name text,
#     last_name text,
#     email text
#     )""")
# many_customers = [('Wes','Brown', 'Wesbrown@.com'),
#                   ('John','Blue', 'Tsbrown@.com'),
#                   ('Barry','Green', 'ILsbrown@.com')]
# c.executemany("INSERT INTO customers VALUES (?, ?, ?)",many_customers)
# conn.commit()
# c.execute("SELECT rowid, * FROM customers")
# items = c.fetchall()
# for item in items:
#     print(item)


#crete a list of tuples and add them all at once to database
# many_customers = [('Wes','Brown', 'Wesbrown@.com'),
#                   ('John','Blue', 'Tsbrown@.com'),
#                   ('Barry','Green', 'ILsbrown@.com')]
# c.executemany("INSERT INTO customers VALUES (?, ?, ?)",many_customers)

#Add in one person to database
#c.executemany("INSERT INTO customers VALUES ('Sean', 'Mc garry', 'Sean@gmail.com')")
#Crete a table
#Dockstrings are used with 3 quotation
# c.execute("""CREATE TABLE customers (
#     first_name text,
#     last_name text,
#     email text
#     )""")

# conn = sqlite3.connect('Drink.db')
# # Conncet to Database
# c = conn.cursor()
# c.execute("""CREATE TABLE Drink (
#     Drink text
#     )""")
# print("Added database")
#
# conn = sqlite3.connect('Drink.db')
# # Conncet to Database
# c.execute("DROP TABLE Dink")
# conn.commit()
# c = conn.cursor()
# c.execute("""CREATE TABLE Drink (
#     Drink text
#     )""")
# c.execute("INSERT INTO Drink VALUES ('Ale')")
# c.execute("SELECT rowid, * FROM Drink")
# items = c.fetchall()
# for item in items:
#     print(item)

#Commit our command
# conn.commit()
#
# #Close our connecton
# conn.close()
# def Clear_DB():
#     conn = sqlite3.connect('Drink.db')
#     print("Delte table")
#     c = conn.cursor()
#     c.execute("DELETE FROM Drink")

def add_one_drink(first):
    conn = sqlite3.connect('Drink.db')
    print(first)
    c = conn.cursor()
    # c.execute("DELETE FROM Drink")
    c.execute("INSERT INTO Drink VALUES (?)",(first,))
    conn.commit()
    conn.close()

# add_one_drink("Happy")
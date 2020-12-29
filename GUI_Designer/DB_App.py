import sqlite3
# from GUI_Designer import Main
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
# c = conn.cursor()
# c.execute("INSERT INTO Drink VALUES ('Budwiser')")
# conn.commit()
# conn.close()

#Qurey the database and return All records
def show_all():

    print("In here")
    # Connect to database or make file called database if none excists
    conn = sqlite3.connect('customer.db')
    # Conncet to Database
    c = conn.cursor()
    c.execute("SELECT rowid, * FROM customers")
    items = c.fetchall()
    for item in items:
        print(item)
    # Commit our command
    conn.commit()
    # Close our connecton
    conn.close()

#Adds a new record to a table
def add_one(first,last,email):
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.execute("INSERT INTO customers VALUES (?,?,?)",(first,last,email))
    conn.commit()
    conn.close()

#Adds a new record to a table
def add_one_drink(first):
    conn = sqlite3.connect('Orders.db')
    print(first)

    for order in first.split():
        c = conn.cursor()
        c.execute("INSERT INTO table_1 VALUES (?)",(order,))
        conn.commit()
    conn.close()

def add_to_table_2(first):
    conn = sqlite3.connect('Orders.db')
    print(first)
    for order in first.split():
        c = conn.cursor()
        c.execute("INSERT INTO table_2 VALUES (?)", (order,))
        conn.commit()
    c = conn.cursor()

# def add_one_drink(first):
#     conn = sqlite3.connect('Drink.db')
#     print(first)
#     c = conn.cursor()
#     c.execute("INSERT INTO Drink VALUES (?)",(first,))
#     conn.commit()
#     conn.close()

#Delete Record from table
def delete_one(id):
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.execute("DELETE from customers WHERE rowid = (?)",id)
    conn.commit()
    conn.close()

#Add many Records to table
def add_many(list):
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.executemany("INSERT INTO customers VALUES (?,?,?)",(list))
    conn.commit()
    conn.close()

#Lookup with Where
def firstName_lookup(name):
    conn = sqlite3.connect('customer.db')
    c = conn.cursor()
    c.execute("SELECT * from customers WHERE first_name = (?)",(name,))
    items = c.fetchall()
    item = ""
    for item in items:
        print(item)
    conn.commit()
    conn.close()
    return item

def Clear_DB():
    conn = sqlite3.connect('Orders.db')
    print("Delte table")
    c = conn.cursor()
    c.execute("DELETE FROM table_1")
    conn.commit()
    conn.close()

def Clear_tabel2_DB():
    conn = sqlite3.connect('Orders.db')
    print("Delte table")
    c = conn.cursor()
    c.execute("DELETE FROM table_2")
    conn.commit()
    conn.close()

# def Clear_DB():
#     conn = sqlite3.connect('Drink.db')
#     print("Delte table")
#     c = conn.cursor()
#     c.execute("DELETE FROM Drink")
#     conn.commit()
#     conn.close()

def Drink_lookup():
    conn = sqlite3.connect('Orders.db')
    c = conn.cursor()
    c.execute("SELECT * FROM table_1")
    items = c.fetchall()
    conn.commit()
    conn.close()
    return items

def lookup_table2():
    conn = sqlite3.connect('Orders.db')
    c = conn.cursor()
    c.execute("SELECT * FROM table_2")
    items = c.fetchall()
    conn.commit()
    conn.close()
    return items

# def Drink_lookup():
#     conn = sqlite3.connect('Drink.db')
#     c = conn.cursor()
#     c.execute("SELECT * FROM Drink")
#     items = c.fetchall()
#     conn.commit()
#     conn.close()
#     return items
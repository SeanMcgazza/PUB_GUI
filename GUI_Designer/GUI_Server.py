from GUI_Designer import DB_App
import socket
import threading


#  The code bellow gets ip address SERVER = "192.168.43.115"
# Get the ip of any network its on using port 5050
HEADER = 84
PORT = 5050
SERVER = socket.gethostbyname(socket.gethostname())
ADDR = (SERVER, PORT)
FORMAT = 'utf-8'
DISSCONNECT_MESSAGE = "!DISCONNECT"
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(ADDR)
global table_1

# Handles all new clients that try to connect to the server
# While connected waits for message length and message from client
# Goes through if statements to check for command from client
def handle_client(conn, addr):
    print(f"[New connection] {addr} connected")
    print("above connected")
    connected = True
    print("below connected")
    while connected:
        # print("In connected")
        msg_length = conn.recv(HEADER).decode(FORMAT)               #Where going to recieve a mesage from client
        if msg_length:
            print(f"The message length {msg_length}")
            msg_length = int(msg_length)
            msg = conn.recv(msg_length).decode(FORMAT)
            if msg == DISSCONNECT_MESSAGE:
                connected=False
                conn.close
            if "Clear_Table_1" in msg:
                cleardb()

            if "Clear_Table_2" in msg:
                clear_table2_db()

            if "Table_1" in msg:
                print("In update table 1 " + msg)
                update_table_1(conn, addr)
                # update_drinkDB(conn, addr, msg)

            if "Table_2" in msg:
                print("In update table 2 " + msg)
                update_table_2(conn, addr)
                # update_drinkDB(conn, addr, msg)
            # if "Table_2" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # if "Heineken" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # if "Guinness" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # if "Burger" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # if "Chips" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # if "Kebab" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # if "Pizza" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # if "Carlsberg" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # if "Rock_Shore" in msg:
            #     print("In if statement " + msg)
            #     update_drinkDB(conn, addr, msg)
            # Find_Drink_Ordered(msg,conn)
            print(f"[{addr}] [{msg}]")
            conn.send("MSG received".encode(FORMAT))
    # conn.close

# This function is called in Main.py to start server
def start():
    server.listen()
    print(f"[Listening] Server is listening {SERVER}")
    while True:
        conn, addr = server.accept()        #sets up new connection and stor addr and port
        thread = threading.Thread(target=handle_client, args = (conn, addr))
        thread.start()
        print(f"[Active connections]{threading.active_count() - 1}")

# Order from table 2 has come in now read all of the order
def update_table_2(conn, addr):
    connected = True
    while connected:
        print("In connected new part table 2")
        msg_length = conn.recv(HEADER).decode(FORMAT)  # Where going to recieve a mesage from client
        if msg_length:
            print(f"The message length {msg_length}")
            msg_length = int(msg_length)
            msg = conn.recv(msg_length).decode(FORMAT)
            print("This is the message recived :" + msg)
            if "Clear" in msg:
                clear_table2_db()

            if "Heineken" in msg:
                print("In if statement " + msg)
                table_2_order(conn, addr, msg)
                msg = ""

            if "Guinness" in msg:
                print("In if statement " + msg)
                table_2_order(conn, addr, msg)
                msg = ""

            if "Burger" in msg:
                print("In Burger if statement " + msg)
                table_2_order(conn, addr, msg)
                msg = ""

            if "Chips" in msg:
                print("In if statement " + msg)
                table_2_order(conn, addr, msg)
                msg = ""

            if "Kebab" in msg:
                print("In if statement " + msg)
                table_2_order(conn, addr, msg)
                msg = ""

            if "Pizza" in msg:
                print("In if statement " + msg)
                table_2_order(conn, addr, msg)
                msg = ""

            if "Carlsberg" in msg:
                print("In if statement " + msg)
                table_2_order(conn, addr, msg)
                msg = ""

            if "Rock_Shore" in msg:
                print("In if statement " + msg)
                table_2_order(conn, addr, msg)
                msg = ""

# Order from table 1 has come in now read all of the order
def update_table_1(conn, addr):
    connected = True
    while connected:
        print("In connected new part")
        msg_length = conn.recv(HEADER).decode(FORMAT)  # Where going to recieve a mesage from client
        if msg_length:
            print(f"The message length {msg_length}")
            msg_length = int(msg_length)
            msg = conn.recv(msg_length).decode(FORMAT)
            if "Clear" in msg:
                cleardb()
            if "Heineken" in msg:
                print("In if statement " + msg)
                update_drinkDB(conn, addr, msg)
                msg = ""

            if "Guinness" in msg:
                print("In if statement " + msg)
                update_drinkDB(conn, addr, msg)
                msg = ""

            if "Burger" in msg:
                print("In Burger if statement " + msg)
                update_drinkDB(conn, addr, msg)
                msg = ""

            if "Chips" in msg:
                print("In if statement " + msg)
                update_drinkDB(conn, addr, msg)
                msg = ""

            if "Kebab" in msg:
                print("In if statement " + msg)
                update_drinkDB(conn, addr, msg)
                msg = ""

            if "Pizza" in msg:
                print("In if statement " + msg)
                update_drinkDB(conn, addr, msg)
                msg = ""

            if "Carlsberg" in msg:
                print("In if statement " + msg)
                update_drinkDB(conn, addr, msg)
                msg = ""

            if "Rock_Shore" in msg:
                print("In if statement " + msg)
                update_drinkDB(conn, addr, msg)
                msg = ""

# Clear table 1 database so it clears the GUI
def cleardb():
    print("Inside clear db")
    DB_App.Clear_DB()
    return

# Clear table 2 database so it clears the GUI
def clear_table2_db():
    print("Inside clear table 2 db")
    DB_App.Clear_tabel2_DB()
    return

# Update table 1 database with orders
def update_drinkDB(conn, addr,msg):
    conn.send("Drink has been ordered".encode(FORMAT))
    DB_App.add_one_drink(msg)
    print("Inside update Drinkdb")
    return (conn,addr)

# Update table 2 database with orders
def table_2_order(conn, addr,msg):
    conn.send("Drink has been ordered in table 2".encode(FORMAT))
    DB_App.add_to_table_2(msg)
    print("Inside update Drinkdb")
    return (conn,addr)

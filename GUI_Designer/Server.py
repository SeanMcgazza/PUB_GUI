from GUI_Designer import DB_App
import socket
import threading


HEADER = 64
PORT = 5050

#  The code bellow gets ip address SERVER = "192.168.43.115"
SERVER = socket.gethostbyname(socket.gethostname())
ADDR = (SERVER, PORT)
FORMAT = 'utf-8'
DISSCONNECT_MESSAGE = "!DISCONNECT"
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(ADDR)



def handle_client(conn, addr):
    print(f"[New connection] {addr} connected")
    connected = True
    while connected:
        msg_length = conn.recv(HEADER).decode(FORMAT)               #Where going to recieve a mesage from client
        if msg_length:
            print(f"The message length {msg_length}")
            msg_length = int(msg_length)
            msg = conn.recv(msg_length).decode(FORMAT)
            if msg == DISSCONNECT_MESSAGE:
                connected=False
            if "yes" in msg:
                print("In if statement" + msg)
                response_handler(conn, msg)
            # Find_Drink_Ordered(msg,conn)
            print(f"[{addr}] [{msg}]")
            conn.send("MSG received".encode(FORMAT))
    conn.close

def start():
    server.listen()
    print(f"[Listening] Server is listening {SERVER}")
    while True:
        conn, addr = server.accept()        #sets up new connection and stor addr and port
        thread = threading.Thread(target=handle_client, args = (conn, addr))
        thread.start()
        print(f"[Active connections]{threading.active_count() - 1}")

def response_handler(conn, addr):
    print("In handler")
    conn.send("What would you like to order".encode(FORMAT))
    connected = True
    while connected:
        msg_length = conn.recv(HEADER).decode(FORMAT)  # Where going to recieve a mesage from client
        if msg_length:
            print(f"The message length {msg_length}")
            msg_length = int(msg_length)
            msg = conn.recv(msg_length).decode(FORMAT)
            if msg == "Drink":
                conn.update_drinkDB(conn, addr)
            if msg == "Food":
                conn.update_foodDB(conn, addr)
            if msg == "Bill":
                conn.want_bill(conn, addr)


def update_drinkDB(self,conn, addr):
    DB_App.add_one("chop", "Heineken", "Whiskey")
    print("Update drinks has been run")
    print("My app has been run")
    conn.send("Drinks are on the way".encode(FORMAT))
    conn.response_handler(conn, addr)

def update_foodDB(conn, addr):
    DB_App.add_one("Burger","Chips", "Fish")
    conn.send("Drinks are on the way".encode(FORMAT))
    conn.response_handler(conn, addr)

def want_bill(conn, addr):
    DB_App.add_one("Dave", "We", "Are here")
    conn.send("Drinks are on the way".encode(FORMAT))
    conn.response_handler(conn, addr)

    return

print("[Starting} server is starting..")
start()

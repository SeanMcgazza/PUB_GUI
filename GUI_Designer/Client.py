import socket
from GUI_Designer.Client_GUI import *
import threading
import sys
import pickle

HEADER = 64
PORT = 5050
FORMAT = 'utf-8'
DISSCONNECT_MESSAGE = "!DISCONNECT"
SERVER = socket.gethostbyname(socket.gethostname())
ADDR = (SERVER,PORT)

order = []

class MyApp(Ui_MainWindow):
    def run_client(self):
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.connect(ADDR)
        pass
    def __init__(self,window):
        self.setupUi(window)
        c1 = threading.Thread(target=self.run_client())
        c1.start()
        t1 = threading.Thread(target=self.setupUi(MainWindow))
        t1.start()

        self.pushButton_Heineken.clicked.connect(lambda: self.store_order("Heineken"))
        self.pushButton_Bud.clicked.connect(lambda: self.store_order("Bud"))
        self.pushButton_Burger.clicked.connect(lambda: self.store_order("Burger"))
        self.pushButton_Fish.clicked.connect(lambda: self.store_order("Fish"))

        self.pushButton_Order.clicked.connect(lambda: self.send_drink(order))

    def send(msg):
        print("Here 1")
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.connect(ADDR)
        message = msg.encode(FORMAT)
        msg_length = len(message)
        print(msg_length)
        send_length = str(msg_length).encode(FORMAT)
        send_length += b' ' * (HEADER -len(send_length))
        client.send(send_length)
        client.send(message)
        print(client.recv(2048).decode(FORMAT))

    def store_order(self,customer_order):
        print("Got to here but" + customer_order)
        global order
        order.append(customer_order)
        print(f'The order {order}')

    def send_drink(self, msg):
        print(msg)
        print("Drink is here")
        print("Here 1")
        message_clear="Clear"
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.connect(ADDR)
        message1 = message_clear.encode(FORMAT)
        msg_length = len(message1)
        print(msg_length)
        send_length = str(msg_length).encode(FORMAT)
        send_length += b' ' * (HEADER - len(send_length))
        client.send(send_length)
        client.send(message1)
        print(client.recv(2048).decode(FORMAT))
        for message in msg:
            print(message)
            message1 = message.encode(FORMAT)
            msg_length = len(message1)
            print(msg_length)
            send_length = str(msg_length).encode(FORMAT)
            send_length += b' ' * (HEADER - len(send_length))
            client.send(send_length)
            client.send(message1)
            while client.recv(2048).decode(FORMAT) != "MSG received":
                print("Waiting for reply")
                pass

        global order
        order.clear()
        # self.send("Drink Of the best")
    # send(DISSCONNECT_MESSAGE)


# if __name__ == "__main__":
# #     import sys
app = QtWidgets.QApplication(sys.argv)
MainWindow = QtWidgets.QMainWindow()
ui = MyApp(MainWindow)
# ui.setupUi(MainWindow)
MainWindow.show()
app.exec_()

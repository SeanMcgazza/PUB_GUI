#from PyQt5 import QtCore, QtGui, QtWidgets
from GUI_Designer import DB_App
from GUI_Designer.Test import *
from GUI_Designer import GUI_Server
import sys
from threading import Timer
import  threading

# Setup threads to run GUI and server
# Refresh the GUI every 8 seconds after the program runs
class MyApp(Ui_MainWindow):
    def __init__(self, window):
        self.setupUi(window)
        t1 = threading.Thread(target=GUI_Server.start)
        countdown_thread = Timer(interval=8, function=self.Button_Pressed)
        t1.start()
        countdown_thread.start()
        self.Order_button.clicked.connect(self.Button_Pressed)

    def Button_Pressed(self):
        self.Order_1.clear()
        self.Order_2.clear()
        user =DB_App.Drink_lookup()
        x = 0
        for use in user:
            # print(x)
            str_txt= str(use).strip("()',")
            print(str_txt)
            self.Order_1.insertItem(x, str_txt)
            x+=1
        user = DB_App.lookup_table2()
        x = 0
        for use in user:
            # print(x)
            str_txt = str(use).strip("()',")
            print(str_txt)
            self.Order_2.insertItem(x, str_txt)
            x += 1
        countdown_thread = Timer(interval=5, function=self.Button_Pressed)
        countdown_thread.start()
        self.Update_Que()

    def Update_Tables(self):
        user = DB_App.firstName_lookup("chop")
        print(user)

    def Update_Que(self):
        self.Order_List.clear()
        self.Order_List.addItem("Table 1")
        self.Order_List.addItem("Table 2")
        self.Order_List.addItem("Table 3")
        self.Order_List.addItem("Table 4")



# if __name__ == "__main__":
# #     import sys
app = QtWidgets.QApplication(sys.argv)
MainWindow = QtWidgets.QMainWindow()
ui = MyApp(MainWindow)
# ui.setupUi(MainWindow)
MainWindow.show()
app.exec_()
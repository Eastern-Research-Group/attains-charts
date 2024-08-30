import os
import datetime

today = datetime.datetime.now().strftime('%Y-%m-%d')
text = """downloadDate =  '""" + today + """';

window.onload = function() {
   document.getElementById("downloadDate").innerHTML = 'Data in these charts were downloaded from the ATTAINS web services on ' + downloadDate + '.';
}""";
with open('js/downloadDate.js', 'w', encoding='utf-8') as output_file:
    output_file.write(text)

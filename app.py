from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/assets/<filename>')
def serve_asset(filename):
    return send_from_directory(os.path.join(app.root_path, 'static', 'assets'), filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

from flask import Flask, request, jsonify, session, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
import secrets
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__, static_folder='../Front End/static', static_url_path='/static')

CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['SESSION_TYPE'] = 'filesystem'
db = SQLAlchemy(app)
Session(app)
socketio = SocketIO(app, cors_allowed_origins="*")

class UserModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

    def __repr__(self):
        return f"User(username={self.username}, email={self.email}, password={self.password})"

class BallPosition(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    x = db.Column(db.Float, nullable=False)
    y = db.Column(db.Float, nullable=False)
    z = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return f"BallPosition(x={self.x}, y={self.y}, z={self.z})"

   
@app.route('/')
def index():
    return send_from_directory(os.path.join(app.root_path, '..', 'Front End'), 'index.html')
@app.route('/home.html')
def home():
    return send_from_directory(os.path.join(app.root_path, '..', 'Front End'), 'home.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username').strip()
    email = data.get('email').strip()
    password = data.get('password').strip()

    if UserModel.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409
    if UserModel.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 409

    new_user = UserModel(username=username, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()
    print(f"Registered user: {new_user}")
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email').strip()
    password = data.get('password').strip()

    #print(f"Attempting login with username: {username}, password: {password}")

    user = UserModel.query.filter_by(email=email).first()
    if not user:
        #print(f"No such user: {username}")
        return jsonify({"message": "Invalid credentials"}), 401

    if user.password != password:
        #print(f"Invalid password for user: {username}. Expected: {user.password}, Got: {password}")
        return jsonify({"message": "Invalid credentials"}), 401

    session['user_id'] = user.id
    session['email'] = user.email
    #print(f"Logged in user: {user}")
    return jsonify({"message": "Logged in successfully","home_page_link":"home.html"}), 200

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/protected', methods=['GET'])
def protected():
    if 'user_id' not in session:
        return jsonify({"message": "Not authenticated"}), 401

    return jsonify({"message": f"Hello, {session['username']}!"}), 200

@app.route('/position', methods=['POST'])
def update_position():
    data = request.get_json()
    x = data.get('x')
    y = data.get('y')
    z = data.get('z')

    new_position = BallPosition(x=x, y=y, z=z)
    db.session.add(new_position)
    db.session.commit()

    socketio.emit('update_position', {'x': x, 'y': y, 'z': z},to = None)
    return jsonify({"message": "Position updated successfully"}), 201

@app.route('/position', methods=['GET'])
def get_position():
    position = BallPosition.query.order_by(BallPosition.id.desc()).first()
    if position:
        return jsonify({"x": position.x, "y": position.y, "z": position.z}), 200
    else:
        return jsonify({"message": "No position found"}), 404


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)

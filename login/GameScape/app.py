from flask import Flask, request, render_template , redirect, session
from databas import connect_db   
from werkzeug.security import check_password_hash ,generate_password_hash

app = Flask(__name__)

app.secret_key = "hemlig_nyckel"

@app.route('/')
def home():
    return render_template('registrera.html')


@app.route('/login', methods=['GET', 'post'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    
    user_name = request.form.get('user_name')
    password =  request.form.get('password')

    conn , cur = connect_db()
    if conn is None:
        return 'database error'
    try:
        query = """
            select * FROM users Where username = %s
"""
        cur.execute(query, (user_name,))
        user = cur.fetchone()

        if user is None:
            return 'user des not exist'

        if not check_password_hash(user[3],password):
            return 'wrong password'
        
        session['user_id'] = user[0]
        session['username'] = user[1]

        return redirect('/dashboard')


    except Exception as e:
        print('e')
        return 'login error '
    finally:
        cur.cloce()
        conn.cloce()


@app.route('/registrera',methods=['POST', 'GET'])
def register():
    if request.method == 'GET':
        return render_template('registrera.html')
    #hämta data från HTML
    user_name = request.form.get('username')
    password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')
    full_name = request.form.get('full_name')
    email = request.form.get('email')
    birthday = request.form.get('birthday')
    gender = request.form.get('gender')

    #kontrol passwoed 

    if password != confirm_password:
        return 'passwords do not match'
    
    if len(password) < 10 :
        return 'lösenordet måste vara minst 10 tecken'
    elif len(password) > 20:
        return 'lösenordet får max vara 20 tecken'

    has_upper = False

    for char in password:
        if char.isupper():
            has_upper = True
            break

    if not has_upper:
        return 'lösenordet måste innehålla minst en stor bokstav'
    
    has_upper = False

    for char in password:
        if char.isdigit():
            has_upper = True
            break

    if not has_upper:
        return 'lösenordet måste innehålla minst en siffra'
    
    if not birthday:
        return "Please select birthday"
    
    if not gender: 
        return 'please select gender'
    #kontrol older
    if not user_name or not password or not email or not full_name:
        return "Missing required fields"
    conn , cur = connect_db()

    if conn is None:
        return 'database error'
    
    try:
        
        cur.execute('SELECT * from users WHERE username = %s', (user_name,))
        existing_user_username = cur.fetchone()

        if existing_user_username:
            return 'username already exists'
        

        cur.execute('SELECT * from users WHERE email = %s', (email,))
        existing_email = cur.fetchone()

        if existing_email :
            return 'Email already exists'
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    
        query = """
                INSERT INTO users 
            (username, email, password, full_name, birthday, gender)
            VALUES (%s, %s, %s, %s, %s, %s)
        

"""
        cur.execute(query,(user_name, email, hashed_password, full_name, birthday, gender))

        conn.commit()
        return 'user registered successfully'
    except Exception as e:
        print(e)
        return 'error inserting user'
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)
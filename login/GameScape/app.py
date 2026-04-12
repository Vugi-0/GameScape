from flask import Flask, request, render_template
from databas import connect_db   


app = Flask(__name__)


@app.route('/')
def home():
    return render_template('registrera.html')


@app.route('/registrera',methods=['POST', 'GET'])
def register():
    if request.method == 'GET':
        return render_template('registrera.html')
    #hämta data från HTML
    username = request.form.get('username')
    password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')
    full_name = request.form.get('full_name')
    email = request.form.get('email')
    birthday = request.form.get('birthday')
    gender = request.form.get('gender')

    #kontrol passwoed 

    if password != confirm_password:
        return 'passwords do not match'
    if not birthday:
        return "Please select birthday"
    
    if not gender: 
        return 'please select gender'
    #kontrol older
    if not username or not password or not email or not full_name:
        return "Missing required fields"
    conn , cur = connect_db()

    if conn is None:
        return 'database error'
    
    try:
        query = """
                INSERT INTO users 
            (username, email, password, full_name, birthday, gender)
            VALUES (%s, %s, %s, %s, %s, %s)
        

"""
        cur.execute(query,(username, email, password, full_name, birthday, gender))

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
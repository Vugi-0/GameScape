import psycopg2 as psql
import configparser

def connect_db():
    config= configparser.ConfigParser()
    config.read('config.ini')


    db_config = {
        'host': config['database']['host'].strip(),
        'user': config['database']['user'].strip(),
        'port': config['database']['port'],
        'password': config['database']['password'],
        'dbname': config['database']['database'],
        'sslmode':'require'
,


    }

    try:
        connection = psql.connect(**db_config)
        print('uppkopplad till databasen')
        cursor = connection.cursor()
        cursor.execute("SET search_path TO public")
        #cursor.execute("SELECT * FROM time_slots")
        #print (cursor.fetchall())
        return connection, cursor
        
    except Exception as e:
        print("Fel i anslutning till databasen")
        print(e)
        return None, None
    
if __name__ == "__main__":
    connect_db()
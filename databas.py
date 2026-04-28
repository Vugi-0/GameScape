import psycopg2 as psql
import configparser
import os
 
def connect_db():
    config = configparser.ConfigParser()
 
    # Always find config.ini relative to this file, not the working directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(base_dir, 'config.ini')
    config.read(config_path)
 
    db_config = {
        'host':     config['database']['host'].strip(),
        'user':     config['database']['user'].strip(),
        'port':     config['database']['port'].strip(),
        'password': config['database']['password'].strip(),
        'dbname':   config['database']['database'].strip(),
        'sslmode':  'require'
    }
 
    try:
        connection = psql.connect(**db_config)
        print('uppkopplad till databasen')
        cursor = connection.cursor()
        cursor.execute("SET search_path TO public")
        return connection, cursor
 
    except Exception as e:
        print("Fel i anslutning till databasen")
        print(e)
        return None, None
 
if __name__ == "__main__":
    connect_db()
 
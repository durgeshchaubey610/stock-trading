import os
import sys
import time
import pymysql

def wait_for_database(max_retries: int = 40, delay_seconds: int = 2):
    """
    Waits until the MySQL database is reachable and accepting connections.
    """
    host = os.getenv("DB_HOST", "localhost")
    port = int(os.getenv("DB_PORT", "3306"))
    user = os.getenv("DB_USER", "stock_user")
    password = os.getenv("DB_PASS", "stock_password")
    database = os.getenv("DB_NAME", "stock_ai")

    print(f"Waiting for database connection at {host}:{port} (db: {database}, user: {user})...")

    for attempt in range(1, max_retries + 1):
        try:
            conn = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                connect_timeout=3
            )
            conn.close()
            print(f"Successfully connected to database at {host}:{port} on attempt {attempt}!")
            return True
        except Exception as err:
            print(f"Database not ready yet (attempt {attempt}/{max_retries}): {err}")
            time.sleep(delay_seconds)

    print(f"Failed to connect to database at {host}:{port} after {max_retries} attempts.")
    return False

if __name__ == "__main__":
    success = wait_for_database()
    if not success:
        sys.exit(1)

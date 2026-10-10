import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))
url = os.getenv('DATABASE_URL')
conn = psycopg2.connect(url)
cur = conn.cursor()
cur.execute('SELECT COUNT(*), category_name, status FROM "Product" GROUP BY category_name, status')
print("Direct DB query result:")
for row in cur.fetchall():
    print(row)
conn.close()

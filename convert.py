import snowflake.connector
import json

# Snowflake connection details
SNOWFLAKE_ACCOUNT = "hewvhtb-rh34135"
SNOWFLAKE_USER = "dhaval"
SNOWFLAKE_PASSWORD = "Finopsys@1234"
SNOWFLAKE_WAREHOUSE = "FINOPSYS_WH"
SNOWFLAKE_DATABASE = "FINOPSYS_DB"
SNOWFLAKE_SCHEMA = "PUBLIC"
SNOWFLAKE_ROLE = "ACCOUNTADMIN"

def init_database():
    conn = snowflake.connector.connect(
        account=SNOWFLAKE_ACCOUNT,
        user=SNOWFLAKE_USER,
        password=SNOWFLAKE_PASSWORD,
        warehouse=SNOWFLAKE_WAREHOUSE,
        database=SNOWFLAKE_DATABASE,
        schema=SNOWFLAKE_SCHEMA,
        role=SNOWFLAKE_ROLE
    )
    return conn

# Connect to Snowflake
conn = init_database()

# Query the data, excluding the BILL_DATA column
cursor = conn.cursor()
query = """
SELECT OBJECT_CONSTRUCT(
    'CASE_ID', CASE_ID,
    'BILL_ID', BILL_ID,
    'CUSTOMER_ID', CUSTOMER_ID,
    'VENDOR_ID', VENDOR_ID,
    'DUE_DATE', DUE_DATE,
    'AMOUNT', AMOUNT,
    'BALANCE_AMOUNT', BALANCE_AMOUNT,
    'PAID', PAID,
    'STATUS', STATUS,
    'INBOX_METHOD', INBOX_METHOD,
    'RECEIVING_DATE', RECEIVING_DATE,
    'DEPARTMENT', DEPARTMENT,
    'GL_CODE', GL_CODE,
    'BILL_NAME', BILL_NAME,
    'DECLINE_DATE', DECLINE_DATE,
    'DECLINE_REASON', DECLINE_REASON,
    'DATE', DATE,
    'BILL_DATA_JSON', BILL_DATA_JSON
) AS json_data
FROM invoice
"""
cursor.execute(query)

# Fetch and convert to JSON
data = [row[0] for row in cursor.fetchall()]
json_output = json.dumps(data, indent=4)

# Save to file
with open("output.json", "w") as file:
    file.write(json_output)

# Close connection
cursor.close()
conn.close()
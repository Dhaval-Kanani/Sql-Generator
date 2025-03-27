const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const snowflake = require('snowflake-sdk');

// Read your static JSON file (if needed by the model)
const jsonDocument = JSON.parse(fs.readFileSync('output.json', 'utf8'));


// Snowflake connection setup
const connection = snowflake.createConnection({
    account: 'hewvhtb-rh34135',
    username: 'dhaval',
    password: 'Finopsys@1234',
    warehouse: 'FINOPSYS_WH',
    database: 'FINOPSYS_DB',
    schema: 'PUBLIC',
    role: 'ACCOUNTADMIN'
});

// Connect to Snowflake
connection.connect((err, conn) => {
    if (err) {
        console.error('Unable to connect to Snowflake:', err.message);
        return;
    }
    console.log('Connected to Snowflake as', conn.getId());
    askQuestion();
});

const url = "http://localhost:11434/api/generate"; // Ollama or other LLM API

const chatHistory = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function runSnowflakeQuery(query) {
    return new Promise((resolve, reject) => {
        connection.execute({
            sqlText: query,
            complete: (err, stmt, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        });
    });
}

function askQuestion() {
    rl.question("You: ", (question) => {
        chatHistory.push({ role: "user", content: question });

        // ddlprompt_ =  ddlPrompt.replace('{question}', question);
        const ddlprompt_with_que = `
        <|begin_of_text|><|start_header_id|>user<|end_header_id|>

        Generate a SQL query to answer this question: \`${question}\`

        DDL statements:

        CREATE TABLE FINOPSYS_DB.PUBLIC.INVOICE (
        CASE_ID VARCHAR(50) PRIMARY KEY, -- Unique ID for each invoice case
        BILL_ID VARCHAR(50) UNIQUE, -- Unique ID for each bill
        CUSTOMER_ID VARCHAR(50), -- ID of the customer associated with the invoice
        VENDOR_ID VARCHAR(50), -- ID of the vendor
        DUE_DATE VARCHAR(50), -- Due date for the invoice payment
        AMOUNT VARCHAR(50), -- Total amount of the invoice
        BALANCE_AMOUNT VARCHAR(50), -- Remaining balance to be paid
        PAID VARCHAR(50), -- Amount paid
        STATUS VARCHAR(50), -- Current status of the invoice (e.g., paid, pending)
        INBOX_METHOD VARCHAR(50), -- Method by which invoice was received
        RECEIVING_DATE VARCHAR(50), -- Date the invoice was received
        DEPARTMENT VARCHAR(100), -- Department associated with the invoice
        GL_CODE VARCHAR(50), -- General ledger code for categorization
        BILL_DATA BINARY(8388608), -- Binary data for the bill (e.g., PDF or image)
        BILL_NAME VARCHAR(16777216), -- Original name of the bill file
        DECLINE_DATE VARCHAR(50), -- Date the invoice was declined (if applicable)
        DECLINE_REASON VARCHAR(255), -- Reason for decline
        DATE TIMESTAMP_NTZ(9), -- Timestamp when the invoice was recorded
        BILL_DATA_JSON VARIANT -- Parsed JSON data from the bill
        );

        Chat History: ${JSON.stringify(chatHistory, null, 2)}

        Give ONLY the SQL query as the answer.
        `;



        const payload = {
            model: "sqlcoder:latest", // Ollama model
            prompt: ddlprompt_with_que,
            stream: false
        };

        axios.post(url, payload)
            .then(async (response) => {
                const sqlQuery = response.data.response.trim();
                console.log("\nGenerated SQL Query:\n", sqlQuery);

                try {
                    console.log(sqlQuery);
                    const results = await runSnowflakeQuery(sqlQuery);
                    console.log("\nQuery Result:\n", results);
                    chatHistory.push({ role: "assistant", content: JSON.stringify(results, null, 2) });
                } catch (err) {
                    console.error("\nSnowflake Query Error:", err.message);
                }

                askQuestion();
            })
            .catch(error => {
                console.error("Error:", error.response ? error.response.data : error.message);
                askQuestion();
            });
    });
}

require('dotenv').config();

const db_user = "DB_USERNAME";
const db_pass = "DB_PASSWORD";
const db_name = "DB_NAME";
const db_host = "123.456.78.901";
const db_port = "27017"
const db_uri  = `mongodb://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}`

module.exports = {
    sessionSecret: "EXPRESS_SESSION_SECRET",
    mongoDbOptions: {
        useMongoClient: true,
        autoIndex: false, 
        reconnectTries: Number.MAX_VALUE, 
        reconnectInterval: 500,
        poolSize: 10, 
        bufferMaxEntries: 0
      },
    mongoUrl: db_uri,
    port: 9001
}

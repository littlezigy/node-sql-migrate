const {Pool} = require("pg");
const dbconfig = require("../config/database");
let fs = require('fs');
const util = require('util');
const path = require('path');

const db = {
  connectionString: dbconfig.connectionString,
  max: dbconfig.max,
  idleTimeoutMillis: dbconfig.idleTimeoutMillis,
  connectionTimeoutMillis: dbconfig.connectionTimeoutMillis
}

let folderpath = path.join(__dirname, "../SQL/migrations");

pool = new Pool(db);
const readdir = util.promisify(fs.readdir);
const readfile = util.promisify(fs.readFile);

(async function() {
  let files = await readdir(folderpath);

  const client = await pool.connect();
  try{
    await client.query('BEGIN');
    try {
      //Create version control table if not exists.
      await client.query(`CREATE TABLE IF NOT EXISTS env_db_vc(
                          env_ varchar(12),
                          version_number int NOT NULL DEFAULT 0,
                          CONSTRAINT env_version_control_pk PRIMARY KEY (env_)
                        );`);
      await client.query(`INSERT INTO env_db_vc(env_) VALUES ('${process.env.NODE_ENV}')
                            ON CONFLICT(env_) DO NOTHING;`);
      await client.query("COMMIT");
      let env_version_number_query = await client.query(`SELECT version_number from env_db_vc WHERE env_='${process.env.NODE_ENV}';`);
      let env_version_number = env_version_number_query.rows[0].version_number;
      console.log("BEGINNING MIGRATION");
      for(i = 0; i<files.length; i++) {
        let filestrsplit = files[0].split('-');
        let version_number = filestrsplit[0];
        if(env_version_number < version_number) {
          let sqlquery = await readfile(path.join(folderpath,files[i]), "utf-8");
          await client.query(sqlquery);
          await client.query(`UPDATE env_db_vc
                            SET version_number = ${version_number}
                              WHERE env_='${process.env.NODE_ENV}';`);
          await client.query('COMMIT');
        }
      }
      
      await client.query('END');
    } catch(e) {
      console.log(e, "\nERROR!!!\n\n\nROLLING BACK.");
      await client.query('ROLLBACK');
    }
  } finally {
    client.release();
    process.exit();
  }
}())

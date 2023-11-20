import type { Pool } from "pg";

export default async function insert (client: Pool, temp: any, tableName: string, returning: string[] | null = null, num: number = 0): Promise<any> {
  for (let key of Object.keys(temp)) {
      if (temp[key] == null) {
          delete temp[key];
      }
  }

  if (Object.keys(temp).length == 0) {
      return null;
  }

  let keyString: string = "";
  let valueString: string = "";
  for (let key of Object.keys(temp)) {
      keyString += `${key},`;

      if (typeof temp[key] == "number" || typeof temp[key] == "boolean") {
          valueString += `${temp[key]},`;
      } else if (typeof temp[key] == "string") {
          if (temp[key].includes("{")) {
              valueString += `'${temp[key].replaceAll("'", "''")}',`;
          } else {
              valueString += `'${temp[key].replaceAll("'", "''").replaceAll("\"", "''")}',`;
          }
      } else if (typeof temp[key] == "object") {
          valueString += `'{"${temp[key].join("\", \"").replaceAll("'", "''")}"}',`;
      }
  }

  keyString = keyString.slice(0, -1);
  valueString = valueString.slice(0, -1);

  const conn = await client.connect();

  let result = 0;

  if (returning == null) {
      await conn.query(`INSERT INTO ${tableName} (${keyString})
                            VALUES (${valueString})`)
          .then(async (res: any) => {
              result = res.rows;
          })
          .catch(async (e: any) => {
              num++;
              if (num == 2) {
                  process.exit();
              }
              await insert(client, temp, tableName, returning, num);
          });
  } else {
      const ret = returning.toString();
      await conn.query(`INSERT INTO ${tableName} (${keyString})
                            VALUES (${valueString})
                            RETURNING ${ret}`)
          .then(async (res: any) => {
              result = res.rows;
          })
          .catch(async (e: any) => {
              num++;
              if (num == 2) {
                  process.exit();
              }
              await insert(client, temp, tableName, returning, num);
          });
  }

  conn.release();

  return result;
}
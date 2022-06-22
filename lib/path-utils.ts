import fs from 'fs';
import path from 'path';
import { Database } from 'sqlite';
import sqlite3 from 'sqlite3';

/*
  Requires DB to create directory
  This function does not close DB, so please close it in caller
*/
const createDir = async (
  db: Database<sqlite3.Database, sqlite3.Statement>,
  id: number | null
) => {
  if (!id) {
    // Get Highest Sequence from DB
    const result: [{ seq: number }] = await db.all(
      'SELECT * FROM SQLITE_SEQUENCE'
    );
    id = (result[0]?.seq ?? 0) + 1;
  }

  const absolutePath = path.resolve('/uploads', String(id));
  const relativePath = absolutePath.slice(1);

  // make dir if not existed
  if (!fs.existsSync(relativePath)) fs.mkdirSync(relativePath);

  return { absolutePath, relativePath, param: id };
};

export { createDir };

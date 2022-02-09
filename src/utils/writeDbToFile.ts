import * as fs from 'fs';

interface WriteDbToFile {
    database: string;
}

export const writeDbToFile = (params: WriteDbToFile, cb: CallbackErrorOnly) => {
    fs.writeFile('./database/db.json', params.database, null, cb);
};

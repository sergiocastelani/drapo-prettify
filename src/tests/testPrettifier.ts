//run with: npx tsx src/tests/testCompressor.ts
import { Prettifier } from '../services/Prettifier';
import { open } from 'node:fs/promises';
import { chdir } from 'node:process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
chdir(__dirname);

const prettifier = new Prettifier();

const file = await open('./testExpressions.txt');
let line: string;
let currentFile: string = "";
let lineNumber: number = 0;
for await (line of file.readLines()) 
{
    lineNumber++;
    if (line.startsWith("\\"))
    {
        currentFile = line;
        continue;
    }
    try {
        prettifier.parse(line);
    } catch (error) {
        console.error(currentFile);
        console.error(`${lineNumber}: ${line}`);
        console.error(error);
        break;
    }
}


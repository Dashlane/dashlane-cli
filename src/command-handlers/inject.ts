import fs from 'fs';
import { getVaultContent, initVaultContent } from '../modules/database';

interface InjectOpts {
    in: string;
    out: string;
}

const parse = (template: string) => {
    let result = /{{(.*?)}}/g.exec(template);
    const arr = [];
    let firstPos;

    while (result) {
        firstPos = result.index;
        if (firstPos !== 0) {
            arr.push(template.substring(0, firstPos));
            template = template.slice(firstPos);
        }

        arr.push(result[0]);
        template = template.slice(result[0].length);
        result = /{{(.*?)}}/g.exec(template);
    }

    if (template) {
        arr.push(template);
    }

    return arr;
};

const compile = (template: string) => {
    const ast = parse(template);
    let fnStr = '';

    ast.map((t) => {
        if (t.startsWith('{{') && t.endsWith('}}')) {
            const key = t.split(/{{|}}/).filter(Boolean)[0].trim();
            if (key.startsWith('dl://')) {
                fnStr += getVaultContent(key);
                return;
            }
        }
        fnStr += t;
    });

    return fnStr;
};

export const runInject = async (options: InjectOpts) => {
    const { in: inputFilePath, out: outputFilePath } = options;

    await initVaultContent();

    if (inputFilePath) {
        const input = fs.readFileSync(inputFilePath, 'utf8');

        outputContent(compile(input), outputFilePath);
        return;
    }

    let stdin = '';

    process.stdin.on('readable', () => {
        const chunk = process.stdin.read() as string;
        if (chunk !== null) {
            stdin += chunk;
        }
    });

    process.stdin.on('end', () => {
        outputContent(compile(stdin.trim()), outputFilePath);
    });
};

const outputContent = (output: string, outputFilePath?: string) => {
    if (outputFilePath) {
        fs.writeFileSync(outputFilePath, output);
    } else {
        console.log(output);
    }
};

import * as fs from 'fs-extra';
export function extractDateTimeFromPath(filePath) {
    try {
        const parts = filePath.split(/[/\\]/);
        const fileName = parts[parts.length - 1];
        const dateTimePart = fileName.split('.')[0];
        return dateTimePart;
    }
    catch (error) {
        return undefined;
    }
}
export function fileExists(file) {
    return fs.existsSync(file);
}
//# sourceMappingURL=file-utils.js.map
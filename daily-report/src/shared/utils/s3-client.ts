import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import archiver from 'archiver';

export class S3Client {
    private readonly s3BucketName = 'dev-accelerate-report-exports';
    s3 = new AWS.S3({ region: 'us-east-1' });

    async zipAndUploadFolderToS3(email: string, queryDate: string, folderPath: string, subject: string): Promise<void> {
        const zipFilePath = `/tmp/${this.getFileName(subject, queryDate)}.zip`;

        await this.zipFolder(folderPath, zipFilePath);

        const fileContent = fs.readFileSync(zipFilePath);

        await this.uploadToS3(`${email}_transactions_${queryDate}`, 'transactions.zip', fileContent, subject);

        fs.unlinkSync(zipFilePath);
    }

    async zipFolder(folderPath: string, outputFilePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                console.log(`Zipped folder: ${archive.pointer()} total bytes`);
                resolve();
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(folderPath, false);
            archive.finalize();
        });
    }

    async uploadToS3(folderPath: string, fileName: string, fileContent: Buffer, subject: string): Promise<void> {
        const key = `${this.capitalizeFirstLetter(subject)}-Export/${folderPath}/${fileName}`;

        console.log('Uploading file with key:', key);

        const params = {
            Bucket: this.s3BucketName,
            Key: key,
            Body: fileContent,
            ContentType: 'application/zip',
        };

        try {
            await this.s3.putObject(params).promise();
            console.log(`Successfully uploaded: ${fileName}`);
        } catch (err) {
            console.error(`Error uploading to S3: ${fileName}`, err);
            throw err;
        }
    }

    async getDownloadLink(filePath: string, subject: string): Promise<string> {
        const key = `${this.capitalizeFirstLetter(subject)}-Export/${filePath}`;

        console.log('Generating download link for file with key:', key);

        const params = {
            Bucket: this.s3BucketName,
            Key: key,
            Expires: 60 * 60, // Link expires in 1 hour
        };

        const url = this.s3.getSignedUrl('getObject', params);
        return url;
    }

    getFileName(serviceName: string, queryDate: string): string {
        return `${this.capitalizeFirstLetter(serviceName)}_transactions_${queryDate}`;
    }

    capitalizeFirstLetter(string: string): string {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
}

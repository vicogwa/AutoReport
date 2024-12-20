import { createObjectCsvWriter } from 'csv-writer';

export class CsvService {
    async generateCSV(header: any, transactions: any[], filePath: string): Promise<void> {
        const csvWriter = createObjectCsvWriter({
            path: filePath,
            header: header,
        });

        await csvWriter.writeRecords(transactions);
        console.log('CSV file created successfully');
    }
}

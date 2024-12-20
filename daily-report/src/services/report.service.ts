import mysql from 'mysql2/promise';
import { MysqlDBClient, S3Client } from '../shared';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';

export class ReportService {
    private dataSource = new MysqlDBClient();
    private s3Client = new S3Client();

    private async fetchData(query: string, params: any[] = []): Promise<any[]> {
        let sqlClient: mysql.Connection | undefined;

        try {
            sqlClient = await this.dataSource.connect();
            const [rows] = await sqlClient.execute(query, params);
            return rows as any[];
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }

    private async saveReportToFile(filePath: string, data: any[]): Promise<void> {
        const jsonContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonContent, { encoding: 'utf8' });
    }

    private getCurrentDateForSchedule(schedule: string): string {
        if (schedule === 'daily') {
            return dayjs().format('YYYY-MM-DD');
        } else if (schedule === 'monthly') {
            return dayjs().format('YYYY-MM');
        }
        throw new Error('Invalid schedule type');
    }

    private getQuery(schedule: string): string {
        if (schedule === 'daily') {
            return `
               SELECT
                w.time_stamp,
                w.category,
                w.details,
                w.amount,
                w.balance_snapshot,
                w.recharge_type2 AS recharge_type,
                COALESCE(
                    (SELECT p.service FROM power_transactionitems p WHERE p.transaction_id = w.related_transaction AND p.user = ? LIMIT 1),
                    (SELECT r.network FROM recharge_transactionitems r WHERE r.transaction_id = w.related_transaction AND r.user = ? LIMIT 1),
                    'N/A'
                ) AS service,
                COALESCE(
                    (SELECT p.api_reference_id FROM power_transactionitems p WHERE p.transaction_id = w.related_transaction AND p.user = ? LIMIT 1),
                    (SELECT r.api_reference_id FROM recharge_transactionitems r WHERE r.transaction_id = w.related_transaction AND r.user = ? LIMIT 1),
                    'N/A'
                ) AS customer_reference
            FROM wallet_transactionitems w
            WHERE w.user = ? AND DATE(w.time_stamp) = CURDATE();
            `;
        } else if (schedule === 'monthly') {
            return `
                SELECT
                w.time_stamp,
                w.category,
                w.details,
                w.amount,
                w.balance_snapshot,
                w.recharge_type2 AS recharge_type,
                COALESCE(
                    (SELECT p.service FROM power_transactionitems p WHERE p.transaction_id = w.related_transaction AND p.user = ? LIMIT 1),
                    (SELECT r.network FROM recharge_transactionitems r WHERE r.transaction_id = w.related_transaction AND r.user = ? LIMIT 1),
                    'N/A'
                ) AS service,
                COALESCE(
                    (SELECT p.api_reference_id FROM power_transactionitems p WHERE p.transaction_id = w.related_transaction AND p.user = ? LIMIT 1),
                    (SELECT r.api_reference_id FROM recharge_transactionitems r WHERE r.transaction_id = w.related_transaction AND r.user = ? LIMIT 1),
                    'N/A'
                ) AS customer_reference
            FROM wallet_transactionitems w
            WHERE w.user = ? AND MONTH(w.time_stamp) = MONTH(CURDATE()) AND YEAR(w.time_stamp) = YEAR(CURDATE());
            `;
        }
        throw new Error('Invalid schedule type');
    }

    public async generateReport(schedule: string, userId: number): Promise<void> {
        const query = this.getQuery(schedule);
        const results = await this.fetchData(query, [userId, userId, userId, userId, userId]);
        const queryDate = this.getCurrentDateForSchedule(schedule);

        // Save data to a file
        const tempFolderPath = path.join('/tmp', 'reports');
        const fileName = `${schedule}-report-${Date.now()}.json`;
        const filePath = path.join(tempFolderPath, fileName);

        if (!fs.existsSync(tempFolderPath)) {
            fs.mkdirSync(tempFolderPath, { recursive: true });
        }

        await this.saveReportToFile(filePath, results);

        // Zip and upload
        await this.s3Client.zipAndUploadFolderToS3('user@example.com', queryDate, tempFolderPath, `${schedule} Report`);

        console.log(`${schedule} report generated and uploaded to S3.`);
    }
}

import { SQSEvent, SQSHandler } from 'aws-lambda';
import { ReportService } from '../services';

export const reportHandler = async (event: any): Promise<void> => {
    try {
        console.log('EVENT', event);
        // for (const record of event.Records) {
        //     const body = JSON.parse(record.body);
        const schedule = event.schedule || '';
        const userId = event.userId || 27688;

        const reportService = new ReportService();

        if (schedule === 'daily' || schedule === 'monthly') {
            console.log(`Running ${schedule} report for user ${userId}...`);
            await reportService.generateReport(schedule, userId);
        } else {
            console.error('Invalid or missing schedule provided.');
        }
        // }
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
};

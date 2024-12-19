import { SQSEvent, SQSHandler } from "aws-lambda";
import { ReportService } from "../services";
export const handler: SQSHandler = async (event: any): Promise<void> => {
  try {
    const schedule = event.schedule || ""; 
    const reportService = new ReportService();

    switch (schedule) {
        case "daily":
          console.log("Running daily report...");
          await reportService.runDailyReport();
          break;
      
        case "monthly":
          console.log("Running monthly report...");
          await reportService.runMonthlyReport();
          break;
      
        default:
          console.error("No valid schedule provided.");
          break;
      }
      
  } catch (error) {
    console.error("Error occurred:", error);
    throw error;
  }
};

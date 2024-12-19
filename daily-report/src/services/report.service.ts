import mysql,  { Connection } from "mysql2/promise";


export class ReportService {
    private dbConfig = {
    host: '',
    user:'',
    password: '',
    database: '',
  };

  private async fetchData(query: string): Promise<any> {
    let connection: mysql.Connection | null = null;  
    try {
      // Use promise-based connection
      connection = await mysql.createConnection(this.dbConfig);

      // Execute the query and return the result
      const [rows] = await connection.execute(query);  
      return rows;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    } finally {
      if (connection) {
        // Close the connection
        await connection.end();
      }
    }
  }

  public async runDailyReport(): Promise<void> {
    const query = `
      SELECT
          w.time_stamp,
          w.category,
          w.details,
          w.amount,
          w.balance_snapshot,
          w.recharge_type2 AS recharge_type,
          COALESCE(
              (SELECT p.service FROM power_transactionitems p WHERE p.transaction_id = w.related_transaction and user = 27688 LIMIT 1),
              (SELECT r.network FROM recharge_transactionitems r WHERE r.transaction_id = w.related_transaction and user = 27688 LIMIT 1),
              'N/A'
          ) AS service,
          COALESCE(
              (SELECT p.api_reference_id FROM power_transactionitems p WHERE p.transaction_id = w.related_transaction and user = 27688 LIMIT 1),
              (SELECT r.api_reference_id FROM recharge_transactionitems r WHERE r.transaction_id = w.related_transaction and user = 27688 LIMIT 1),
              'N/A'
          ) AS customer_reference
      FROM wallet_transactionitems w
      WHERE w.user = 27688 AND DATE(w.time_stamp) = CURDATE();
    `;

    const results = await this.fetchData(query);
    console.log("Daily report data:", results);
  }

  public async runMonthlyReport(): Promise<void> {
    const query = `
      SELECT
          w.time_stamp,
          w.category,
          w.details,
          w.amount,
          w.balance_snapshot,
          w.recharge_type2 AS recharge_type,
          COALESCE(
              (SELECT p.service FROM power_transactionitems p WHERE p.transaction_id = w.related_transaction and user = 27688 LIMIT 1),
              (SELECT r.network FROM recharge_transactionitems r WHERE r.transaction_id = w.related_transaction and user = 27688 LIMIT 1),
              'N/A'
          ) AS service,
          COALESCE(
              (SELECT p.api_reference_id FROM power_transactionitems p WHERE p.transaction_id = w.related_transaction and user = 27688 LIMIT 1),
              (SELECT r.api_reference_id FROM recharge_transactionitems r WHERE r.transaction_id = w.related_transaction and user = 27688 LIMIT 1),
              'N/A'
          ) AS customer_reference
      FROM wallet_transactionitems w
      WHERE w.user = 27688 AND MONTH(w.time_stamp) = MONTH(CURDATE()) AND YEAR(w.time_stamp) = YEAR(CURDATE());
    `;

    const results = await this.fetchData(query);
    console.log("Monthly report data:", results);
  }
}

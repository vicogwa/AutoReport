import mysql from 'mysql2/promise';

export class MysqlDBClient {
    private mysqlConnection?: mysql.Connection;
    protected readonly mysqlConfig = {
        host: '167.99.171.73',
        user: 'irecharg_emmanuel',
        password: '12#Emmanuel@$',
        database: 'irecharg_irchrg',
        port: 3306,
    };

    async connect(): Promise<mysql.Connection> {
        if (this.mysqlConnection) {
            return this.mysqlConnection;
        }

        try {
            this.mysqlConnection = await mysql.createConnection(this.mysqlConfig);
            console.log('Successfully connected to MySQL');
            return this.mysqlConnection;
        } catch (err) {
            console.error('MySQL connection error:', err);
            throw err;
        }
    }

    async disconnectFromMySQL(): Promise<void> {
        if (!this.mysqlConnection) {
            console.warn('No active MySQL connection to close.');
            return;
        }

        try {
            await this.mysqlConnection.end();
            console.log('Closed MySQL connection');
        } catch (err) {
            console.error('MySQL disconnection error:', err);
            throw err;
        } finally {
            this.mysqlConnection = undefined;
        }
    }
}

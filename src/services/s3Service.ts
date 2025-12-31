import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../db/db";

export interface S3Config {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export const uploadToS3 = async (
    config: S3Config,
    fileName: string,
    content: string | Blob,
    contentType: string = "application/json"
) => {
    const client = new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: fileName,
        Body: content,
        ContentType: contentType,
    });

    return await client.send(command);
};

export const performFullBackup = async (config: S3Config) => {
    const expenses = await db.expenses.toArray();
    const budgets = await db.budgets.toArray();
    const categories = await db.settings.get("categories");

    // We don't include Blobs in the main JSON backup to keep it small.
    // Receipts should be uploaded individually.
    const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            expenses: expenses.map(({ localReceipt: _localReceipt, ...rest }) => rest), // Strip blobs
            budgets,
            categories: categories?.value ? JSON.parse(categories.value) : [],
        },
    };

    const fileName = `backups/finance_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    return await uploadToS3(config, fileName, JSON.stringify(backupData, null, 2));
};

export const uploadReceiptToS3 = async (config: S3Config, expenseId: string, blob: Blob) => {
    const fileName = `receipts/${expenseId}_${Date.now()}.jpg`;
    await uploadToS3(config, fileName, blob, blob.type);
    return fileName; // Return the S3 key
};

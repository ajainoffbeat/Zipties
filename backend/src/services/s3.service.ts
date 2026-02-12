import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "../config/env.js";
import { AppError } from "../utils/response/appError.js";
import { logger } from "../utils/logger.js";

const s3Client = new S3Client({
    region: env.AWS_S3_REGION as string,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
    },
});

export const uploadToS3 = async (file: Express.Multer.File) => {
    if (!env.AWS_S3_BUCKET_NAME) {
        throw new AppError(500, "AWS S3 Bucket Name is not configured");
    }

    try {
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: env.AWS_S3_BUCKET_NAME,
                Key: `avatars/${Date.now()}-${file.originalname}`,
                Body: file.buffer,
                ACL: "public-read",
                ContentType: file.mimetype,
            },
        });

        const result = await upload.done();

        // The result might contain Location or Key depending on the version and response
        // For S3, Location is usually the public URL if the bucket allows it
        return (result as any).Location || `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_S3_REGION}.amazonaws.com/${(result as any).Key}`;
    } catch (error: any) {
        logger.error("S3 Upload Error", { error });
        throw new AppError(500, `Failed to upload to S3: ${error.message}`);
    }
};

import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "NO_FILE_PROVIDED" }, { status: 400 });
        }

        // Convert File to ArrayBuffer then to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary using a promise to handle the stream-like data
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: "matrix_profiles" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        const uploadResult = result as any;
        console.log("[MATRIX_UPLINK] CLOUDINARY_UPLOAD_SUCCESS:", uploadResult.secure_url);

        return NextResponse.json({ secure_url: uploadResult.secure_url });
    } catch (error: any) {
        console.error("[MATRIX_UPLINK] CLOUDINARY_UPLOAD_ERROR:", error);
        return NextResponse.json(
            { error: "UPLOAD_FAILED", message: error.message },
            { status: 500 }
        );
    }
}

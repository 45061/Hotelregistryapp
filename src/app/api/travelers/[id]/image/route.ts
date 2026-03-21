import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Traveler from "@/lib/models/traveler.model";

const SECRET = process.env.JWT_SECRET;

function buildCloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const signatureBase = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
}

function buildOptimizedCloudinaryUrl(
  cloudName: string,
  publicId: string,
  version?: string | number
) {
  const encodedPublicId = publicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const versionSegment = version ? `v${version}/` : "";

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto:good,dpr_auto,c_limit,w_1800/${versionSegment}${encodedPublicId}`;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const tokenCookie = req.cookies.get("token");
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(tokenCookie.value, SECRET!) as { id: string; authorized: boolean };
    if (!decoded?.id || !decoded.authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const traveler = await (Traveler as any).findById(params.id);
    if (!traveler) {
      return NextResponse.json({ success: false, error: "Traveler not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Image file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only image files are allowed" }, { status: 400 });
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return NextResponse.json({ success: false, error: "The image must be smaller than 5MB" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: "Cloudinary environment variables are not configured" },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const uploadParams = {
      folder: "travelers/policies",
      public_id: `${params.id}-${timestamp}`,
      timestamp,
    };

    const signature = buildCloudinarySignature(uploadParams, apiSecret);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const base64File = `data:${file.type};base64,${fileBuffer.toString("base64")}`;
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", base64File);
    cloudinaryFormData.append("api_key", apiKey);
    cloudinaryFormData.append("timestamp", timestamp);
    cloudinaryFormData.append("folder", uploadParams.folder);
    cloudinaryFormData.append("public_id", uploadParams.public_id);
    cloudinaryFormData.append("signature", signature);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: cloudinaryFormData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadResult.secure_url) {
      console.error("Cloudinary upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        result: uploadResult,
      });

      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error?.message || "Could not upload image to Cloudinary",
          cloudinaryStatus: uploadResponse.status,
        },
        { status: 502 }
      );
    }

    const optimizedImageUrl = buildOptimizedCloudinaryUrl(
      cloudName,
      uploadResult.public_id,
      uploadResult.version
    );

    traveler.documentImageUrl = optimizedImageUrl;
    await traveler.save();

    return NextResponse.json({
      success: true,
      data: {
        documentImageUrl: optimizedImageUrl,
      },
    });
  } catch (error: any) {
    console.error("Error uploading traveler image:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

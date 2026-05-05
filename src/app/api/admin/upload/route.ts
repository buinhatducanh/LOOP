import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if config is loaded correctly
const isCloudinaryConfigured = !!(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Require authentication for upload
export async function POST(req: NextRequest) {
  try {
    if (!isCloudinaryConfigured) {
      console.error("Cloudinary is not configured. Check your environment variables.");
      return badRequest("Cấu hình Cloudinary bị thiếu trong file .env.local");
    }

    const _authUser = await requireAuth(req);

    let fileUrlOrBase64 = "";
    let folder = "loop-uploads";
    let isImage = true;

    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (!body.file) {
        return badRequest("No file provided");
      }
      fileUrlOrBase64 = body.file;
      if (body.folder) folder = body.folder;

      // Validate base64 data URI prefix (security: prevent arbitrary data injection)
      const base64PrefixPattern = /^data:(image\/\w+|video\/\w+);base64,/;
      if (!base64PrefixPattern.test(fileUrlOrBase64)) {
        return badRequest("Invalid file format. Only images and videos are allowed");
      }

      // Validate type from data URI
      isImage = fileUrlOrBase64.startsWith("data:image/");
      if (!isImage && !fileUrlOrBase64.startsWith("data:video/")) {
        return badRequest("Only image and video files are allowed");
      }

      // Enforce size limits based on type
      const isVideo = fileUrlOrBase64.startsWith("data:video/");
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB video, 10MB image
      // base64 inflates size by ~4/3, so decode check: if (base64.length * 3/4) > maxSize → reject
      const estimatedSize = Math.ceil(fileUrlOrBase64.length * 0.75);
      if (estimatedSize > maxSize) {
        return badRequest(`File too large. Maximum size is ${isVideo ? "50MB" : "10MB"}`);
      }
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const folderParam = formData.get("folder") as string | null;
      if (folderParam) folder = folderParam;

      if (!file) {
        return badRequest("No file provided");
      }

      // Validate file type
      isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      if (!isImage && !isVideo) {
        return badRequest("Invalid file type. Only images and videos are allowed.");
      }

      // Validate file size (max 50MB for videos, 10MB for images)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return badRequest(`File too large. Maximum size is ${isVideo ? "50MB" : "10MB"}.`);
      }

      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileUrlOrBase64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(fileUrlOrBase64, {
        folder: folder,
        resource_type: "auto",
        transformation: isImage ? [
          { quality: "auto", fetch_format: "auto" },
        ] : undefined,
      });

      return ok({
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      });
    } catch (uploadError: any) {
      console.error("Cloudinary upload error:", uploadError);
      throw new Error(`Cloudinary Error: ${uploadError.message || "Unknown error"}`);
    }

  } catch (error) {
    console.error("Upload API Error:", error);
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return badRequest("No publicId provided");
    }

    const deleteResult = await cloudinary.uploader.destroy(publicId);

    return ok({ success: deleteResult.result === "ok" });
  } catch (error) {
    return handleError(error);
  }
}

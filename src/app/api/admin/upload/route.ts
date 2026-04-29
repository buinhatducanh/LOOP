import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Require authentication for upload
export async function POST(req: NextRequest) {
  try {
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
      
      // Basic type inference for URL or base64
      if (fileUrlOrBase64.startsWith("data:video")) isImage = false;
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

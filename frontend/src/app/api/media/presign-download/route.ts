import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

import { createMediaS3Client, getMediaS3Config } from "@/lib/media-s3";

type PresignDownloadBody = {
  objectKey?: string;
};

export async function POST(request: Request) {
  let body: PresignDownloadBody;
  try {
    body = (await request.json()) as PresignDownloadBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const objectKey = typeof body.objectKey === "string" ? body.objectKey : "";
  if (!objectKey) {
    return NextResponse.json({ ok: false, error: "missing_objectKey" }, { status: 422 });
  }

  const { bucket } = getMediaS3Config();
  const client = createMediaS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  const expiresInSeconds = 5 * 60;
  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return NextResponse.json({
    ok: true,
    url,
    objectKey,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  });
}


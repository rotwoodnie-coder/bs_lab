#!/bin/sh
set -eu

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
ALIAS="${MINIO_ALIAS:-local}"

echo "Waiting for MinIO at $MINIO_ENDPOINT ..."
tries=0
until mc alias set "$ALIAS" "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" --api S3v4 >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "MinIO not ready after ${tries} tries"
    exit 1
  fi
  sleep 1
done
echo "MinIO ready."

mc mb --ignore-existing "$ALIAS/$MINIO_BUCKET"

if [ -f /init/cors.json ]; then
  mc cors set "$ALIAS/$MINIO_BUCKET" /init/cors.json
fi

if mc admin user info "$ALIAS" "$MEDIA_APP_ACCESS_KEY" >/dev/null 2>&1; then
  echo "user exists: $MEDIA_APP_ACCESS_KEY"
else
  mc admin user add "$ALIAS" "$MEDIA_APP_ACCESS_KEY" "$MEDIA_APP_SECRET_KEY"
fi

POLICY_FILE="/tmp/media-app-policy.json"
cat >"$POLICY_FILE" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BucketList",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::${MINIO_BUCKET}"]
    },
    {
      "Sid": "ObjectReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": ["arn:aws:s3:::${MINIO_BUCKET}/*"]
    }
  ]
}
EOF

mc admin policy create "$ALIAS" media-app-policy "$POLICY_FILE" --force
mc admin policy attach "$ALIAS" media-app-policy --user "$MEDIA_APP_ACCESS_KEY"

echo "MinIO init done."


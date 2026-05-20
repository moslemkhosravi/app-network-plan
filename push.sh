#!/bin/bash

# بررسی اینکه آیا پیامی برای کامیت نوشته‌اید یا نه
if [ -z "$1" ]
then
  COMMIT_MSG="update: auto save from server"
else
  COMMIT_MSG="$1"
fi

echo "⏳ Preparing to push to GitHub..."
git add .
git commit -m "$COMMIT_MSG"
git push

echo "✅ Successfully pushed to GitHub!"

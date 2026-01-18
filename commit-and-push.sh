#!/usr/bin/env bash
set -e

COMMIT_MESSAGE="$1"

if [ -z "$COMMIT_MESSAGE" ]; then
    echo "Usage: ./commit-and-push.sh \"<commit-message>\""
    exit 1
fi

if git diff --quiet && git diff --cached --quiet; then
    echo "No changes to commit."
    exit 0
fi

git add .
git commit -m "$COMMIT_MESSAGE"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push --no-verify origin "$BRANCH"

echo "Changes committed and pushed successfully!"
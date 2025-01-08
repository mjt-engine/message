#!/bin/bash

REPO_URL=$(git remote get-url origin | sed 's/git@github.com:/https:\/\/github.com\//; s/\.git$//')
COMMIT_PATH="/commit"

# Output the header for the changelog
echo "# Changelog"
echo ""

# Get the git log grouped by date
git log --pretty=format:"%ad %s ([%h]($REPO_URL$COMMIT_PATH/%H)) by %an" --date=short | grep -v "Update version" | while IFS= read -r line; do
    # Extract the date from the line
    current_date=$(echo "$line" | awk '{print $1}')
    
    # If the date has changed, print it as a new section
    if [ "$current_date" != "$last_date" ]; then
        echo ""
        echo "## $current_date"
        last_date=$current_date
    fi

    # Print the commit message without the date
    echo "- $(echo "$line" | sed 's/^[0-9-]* //')"
done
#!/bin/sh
# Each public package's postpublish hook: pnpm runs it right after that package publishes, so a later package's failure
# can't cost the earlier ones their releases. It always exits 0, because a failing hook aborts the rest of publish -r.

tag="$npm_package_name@$npm_package_version"

if [ "$GITHUB_ACTIONS" != "true" ] || [ "$npm_config_dry_run" = "true" ]; then
    echo "Skipping GitHub release $tag: not a CI publish"
    exit 0
fi

if gh release view "$tag" > /dev/null 2>&1; then
    echo "GitHub release $tag already exists"
    exit 0
fi

echo "Creating GitHub release $tag"
if ! gh release create "$tag" --title "$tag" --generate-notes --target "$GITHUB_SHA"; then
    echo "::warning::Could not create GitHub release $tag; create it by hand"
fi
exit 0

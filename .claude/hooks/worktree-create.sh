#!/bin/bash
# WorktreeCreate hook: replaces git's default worktree creation, so this
# script must create the worktree itself and print ONLY the resulting
# path on stdout (everything else goes to stderr). The hook's JSON input
# only gives `cwd` (repo root) and `name` (worktree name) - no branch or
# path is suggested, so we derive both ourselves.

input=$(cat)
repo_root=$(echo "$input" | jq -r '.cwd')
name=$(echo "$input" | jq -r '.name')
worktree_path="$repo_root/.claude/worktrees/$name"

default_branch=$(git -C "$repo_root" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
base_ref="origin/${default_branch:-main}"

if ! git -C "$repo_root" worktree add -b "$name" "$worktree_path" "$base_ref" >&2; then
  echo "Failed to create worktree '$name' from $base_ref" >&2
  exit 1
fi

cp "$repo_root/.env" "$worktree_path/.env" 2>/dev/null || true

(
  cd "$worktree_path" || exit 1
  [ ! -d node_modules ] && npm install >&2
  npm run db:generate >&2
)

echo "$worktree_path"

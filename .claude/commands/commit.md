Create a conventional commit for staged changes.

Steps:
1. Run `git status` to show the current state
2. Run `git diff --staged` to show what's staged

If nothing is staged:
- List all changed/untracked files
- Ask which files to include
- Run `git add` for the selected files

3. Determine the commit type based on the changes:
   - `feat` — new feature or capability
   - `fix` — bug fix
   - `refactor` — restructuring without behavior change
   - `docs` — documentation only
   - `style` — formatting, no logic change
   - `test` — adding or updating tests
   - `chore` — build, config, dependency updates

4. Write a concise description (imperative mood: "add X", "fix Y", not "added X")

5. Compose the full commit message:
   ```
   {type}: {description}

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```

6. Show the message to the user and ask for confirmation before running `git commit -m`

7. On confirmation, run the commit using a HEREDOC to preserve formatting correctly.

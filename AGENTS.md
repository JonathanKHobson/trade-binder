# Trade Binder maintenance

Read `README.md` and `docs/project-map.md`. This checkout contains application source on `main`; the generated `gh-pages` branch is the static publication destination.

- Edit application behavior in `app/`, guided by the project map. Keep card source data read-only and preserve owner, quantity, finish, condition and trade restrictions.
- Do not hand-edit `public/data/cards.json`, `cards.json.gz`, `homebrew-cards.json`, generated images in `public/assets/homebrew-cards/`, `dist/` or the `gh-pages` branch. Preserve snapshot references in `public/assets/local-card-images/`; refresh those mirrored files only through a reviewed snapshot change. The README distinguishes the physical snapshot refresh from the external Homebrew Forge renderer.
- `generate:homebrew` depends on the enclosing Forge workspace and its private/source inputs. A standalone clone is sufficient for source inspection, not evidence that this generator can run.
- Use the declared Node version and lockfile. For application changes, run the README's appropriate lint, test, browser and Pages build checks after dependencies are available. Full tests and browser QA also depend on the enclosing Forge workspace; focused tests have narrower coverage. Record missing dependencies or failed checks honestly. For documentation-only edits, verify links, command names and `git diff --check`.
- Preserve the existing Pages URL, compatibility routes and public-contact setting. No new authentication, database writes or cross-device persistence are implied by starter files.
- Keep private collections, unapproved snapshots, personal paths and credentials out of public commits. Review the exact diff. Deployment, data publication and repository lifecycle changes require separate authorization.

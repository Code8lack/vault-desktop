# LockStep Password Vault

> I am loathe to trust other people with my sensitive data, especially with all the data breaches that have occurred of late, and apps not being as secure as advertised, so I decided to build a password app for myself. Well aware of how rusty I was, my intention was to develop it beyond a level where I was fully convinced I wouldn't lose access to my passwords, and to a state in which I felt I wouldn't expose any vulnerabilities.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Svelte, JavaScript, HTML, CSS |
| Bridge | Tauri (Rust) |
| Backend | Erlang (proprietary) |

---

## Architecture

### Auth Flow

*(diagram)*

### Event & Message Flow

*(diagram)*

---

## In Development

- **Category assignment** — organisational grouping of vault entries
- **Nerd Stats carousel** — expanding the current password strength stat into a rotating panel of vault analytics

---

## Testing & Development Status

This project was built for personal use first, with portfolio visibility as a secondary goal. The frontend has been developed and tested through active daily use against a live Erlang backend.

A targeted unit test suite covering payload parsing and frontend security event handling is in progress. Professional third-party penetration testing is planned as the project matures.

This is not a released product. It is a working application and an honest record of where it currently stands.

---

## Licence

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.en.html)

# Alembic Migrations for Chainlit SQLModelDataLayer

This directory contains Alembic migration scripts for the SQLModel-based data layer.

## Best Practices

- **Do not use `SQLModel.metadata.create_all()` in production.**
- Always manage schema changes with Alembic migrations.
- Keep migration scripts in version control.
- Run migrations before starting the app, or enable auto-migration with `CHAINLIT_AUTO_MIGRATE=true`.

## Usage

1. **Configure your database URL** in `alembic.ini`:
   ```ini
   sqlalchemy.url = <your-database-url>
   ```

2. **Autogenerate a migration** (after changing models):
   ```bash
   alembic revision --autogenerate -m "Initial tables"
   ```

3. **Apply migrations**:
   ```bash
   alembic upgrade head
   ```

## Initial Migration

The first migration should create all tables defined in `chainlit.models`.

## env.py

Alembic is configured to use `SQLModel.metadata` from `chainlit.models`.

---

For more details, see the [Alembic documentation](https://alembic.sqlalchemy.org/en/latest/).

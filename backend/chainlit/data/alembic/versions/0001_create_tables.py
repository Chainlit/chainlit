"""
Initial migration: migrate camelCase columns to snake_case for SQLModelDataLayer
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_create_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Thread table: rename camelCase columns to snake_case
    with op.batch_alter_table('thread') as batch_op:
        batch_op.rename_column('createdAt', 'created_at')
        batch_op.rename_column('userId', 'user_id')
        batch_op.rename_column('userIdentifier', 'user_identifier')
        # tags and metadata are already snake_case or compatible
    # Repeat for other tables (User, Step, Element, Feedback)
    with op.batch_alter_table('user') as batch_op:
        batch_op.rename_column('createdAt', 'created_at')
    with op.batch_alter_table('step') as batch_op:
        batch_op.rename_column('threadId', 'thread_id')
        batch_op.rename_column('parentId', 'parent_id')
        batch_op.rename_column('createdAt', 'created_at')
    with op.batch_alter_table('element') as batch_op:
        batch_op.rename_column('threadId', 'thread_id')
        batch_op.rename_column('objectKey', 'object_key')
    with op.batch_alter_table('feedback') as batch_op:
        batch_op.rename_column('forId', 'for_id')
    # If tables do not exist, Alembic will error; users should run this only once during migration.

def downgrade():
    # Reverse the renames for downgrade
    with op.batch_alter_table('thread') as batch_op:
        batch_op.rename_column('created_at', 'createdAt')
        batch_op.rename_column('user_id', 'userId')
        batch_op.rename_column('user_identifier', 'userIdentifier')
    with op.batch_alter_table('user') as batch_op:
        batch_op.rename_column('created_at', 'createdAt')
    with op.batch_alter_table('step') as batch_op:
        batch_op.rename_column('thread_id', 'threadId')
        batch_op.rename_column('parent_id', 'parentId')
        batch_op.rename_column('created_at', 'createdAt')
    with op.batch_alter_table('element') as batch_op:
        batch_op.rename_column('thread_id', 'threadId')
        batch_op.rename_column('object_key', 'objectKey')
    with op.batch_alter_table('feedback') as batch_op:
        batch_op.rename_column('for_id', 'forId')

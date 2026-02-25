#!/usr/bin/env python3
"""
Test Database Connection - Verify asyncpg works with Neon PostgreSQL
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

async def test_database_connection():
    """Test database connection with asyncpg."""
    print("=" * 70)
    print("Database Connection Test")
    print("=" * 70)

    try:
        # Import async session
        from db.async_session import get_session_factory, get_async_engine

        print("\n[1/4] Getting async engine...")
        engine = await get_async_engine()
        print(f"✓ Async engine created")
        print(f"  URL: {str(engine.url).split('@')[1] if '@' in str(engine.url) else 'hidden'}")
        print(f"  Driver: {engine.driver}")

        print("\n[2/4] Getting session factory...")
        factory = await get_session_factory()
        print(f"✓ Session factory created")

        print("\n[3/4] Testing database connection...")
        from sqlalchemy import text
        async with factory() as session:
            # Simple query to test connection
            result = await session.execute(text("SELECT 1 as test"))
            row = result.first()
            if row and row[0] == 1:
                print(f"✓ Database connection successful!")
                print(f"  Query result: {row[0]}")
            else:
                print(f"✗ Query returned unexpected result: {row}")
                return False

        print("\n[4/4] Testing conversations table...")
        async with factory() as session:
            # Check if conversations table exists
            result = await session.execute(text("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_name = 'conversations'
            """))
            row = result.first()
            if row and row[0] > 0:
                print(f"✓ Conversations table exists")
            else:
                print(f"⚠ Conversations table not found (may need migration)")

            # Check if messages table exists
            result = await session.execute(text("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_name = 'messages'
            """))
            row = result.first()
            if row and row[0] > 0:
                print(f"✓ Messages table exists")
            else:
                print(f"⚠ Messages table not found (may need migration)")

        print("\n" + "=" * 70)
        print("✓ All database tests PASSED")
        print("=" * 70)
        return True

    except Exception as e:
        print(f"\n✗ Database connection FAILED:")
        print(f"  Error: {e}")
        print(f"  Type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        print("\n" + "=" * 70)
        print("✗ Database tests FAILED")
        print("=" * 70)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_database_connection())
    sys.exit(0 if success else 1)

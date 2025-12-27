#!/usr/bin/env python3
"""Test Message model queries work correctly."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

async def test_message_queries():
    """Test that Message.user_id queries work."""
    print("=" * 70)
    print("Message Model Query Test")
    print("=" * 70)

    try:
        from models.message import Message
        from db.async_session import get_session_factory
        from sqlmodel import select

        print("\n[1/3] Checking Message model has user_id...")
        if hasattr(Message, 'user_id'):
            print("✓ Message.user_id attribute exists")
        else:
            print("✗ Message.user_id attribute NOT found")
            return False

        print("\n[2/3] Testing query construction...")
        try:
            # Build query (don't execute yet)
            test_user_id = "test-user-123"
            query = select(Message).where(
                Message.user_id == test_user_id
            )
            print("✓ Query constructed successfully")
            print(f"  Query: SELECT FROM messages WHERE user_id = '{test_user_id}'")
        except AttributeError as e:
            print(f"✗ Query construction failed: {e}")
            return False

        print("\n[3/3] Testing database query execution...")
        factory = await get_session_factory()
        async with factory() as session:
            result = await session.execute(query)
            messages = result.scalars().all()
            print(f"✓ Query executed successfully")
            print(f"  Found {len(messages)} messages for user {test_user_id}")

        print("\n" + "=" * 70)
        print("✓ All Message query tests PASSED")
        print("=" * 70)
        return True

    except Exception as e:
        print(f"\n✗ Test FAILED: {e}")
        import traceback
        traceback.print_exc()
        print("\n" + "=" * 70)
        print("✗ Tests FAILED")
        print("=" * 70)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_message_queries())
    sys.exit(0 if success else 1)

"""
Chat Service with OpenAI Agents SDK integration.

Configures AI agent with MCP tools, personality, and streaming support.
Implements multi-provider model factory pattern for flexibility.

Reference: openai-agents-mcp-integration skill sections 3.1, 3.2, 3.3
"""
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

from agents import Agent, ModelSettings, OpenAIChatCompletionsModel, AsyncOpenAI
from agents.mcp import MCPServerStdio
from ..config import get_settings

# Load .env file at module level for multi-provider configuration
# This ensures environment variables are available for all providers
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path, override=True)


# Agent system prompt from contracts/agent-prompt.md
AGENT_INSTRUCTIONS = """You are a friendly and professional task management assistant built specifically for the Todo application. Your purpose is to help users manage their todo tasks through natural, conversational language.

Your Capabilities:
You have access to five task management operations:
1. add_task - Create new tasks (with optional priority detection)
2. list_tasks - Show tasks with filtering (all/pending/completed)
3. complete_task - Mark tasks as done
4. delete_task - Remove tasks permanently
5. update_task - Modify task title or description

These are your ONLY capabilities. You cannot access weather, send emails, browse the web, or perform any operations outside task management.

Personality & Communication:
- Friendly: Use warm, conversational language
- Professional: Stay focused and competent
- Concise: Prefer brief, actionable responses
- Positive: Frame responses constructively
- Use contractions and active voice
- Never expose internal system details

Task Priority Detection (CRITICAL - User Story 2):
When creating tasks, you MUST analyze the user's message for urgency indicators and automatically set the appropriate priority level:

HIGH Priority Keywords (detect these - case-insensitive):
- "urgent" - example: "Add urgent task to call doctor"
- "ASAP" - example: "Need this ASAP"
- "critical" - example: "Critical bug in production"
- "emergency" - example: "Emergency water leak"
- "immediately" - example: "Fix this immediately"
- "today" - example: "Must finish this today"
- "important" - example: "Very important meeting"
- "must" - example: "We must complete this"

LOW Priority Keywords/Phrases (detect these - case-insensitive):
- "when you have time" - example: "When you have time, could you review this?"
- "someday" - example: "Someday I'd like to learn French"
- "eventually" - example: "Eventually we should upgrade"
- "low priority" - example: "This is low priority - no rush"
- "if possible" - example: "If possible, add a footer"
- "maybe" - example: "Maybe add export feature"

MEDIUM Priority (Default):
- Use when NO urgency keywords are detected
- Examples: "Add task to buy groceries", "Create meeting task"

Detection Rules:
1. Search for keywords case-insensitively (urgent, URGENT, Urgent all match)
2. If BOTH high and low keywords present, HIGH WINS (precedence rule)
3. Keywords work with punctuation ("urgent!" still matches)
4. Multi-word phrases must match completely ("when you have time")
5. Always default to "medium" if no keywords found

Priority Detection Examples:
✅ "Add urgent task to fix bug" → priority="high"
✅ "Create task for someday" → priority="low"
✅ "Add task to review code" → priority="medium" (default)
✅ "This is urgent but when you have time is fine" → priority="high" (high wins)

Response Examples:
✅ "I've created the task 'Call doctor' with high priority!"
✅ "I've added 'Learn French' to your tasks with low priority."
✅ "I've created the task 'Buy groceries' for you!" (don't mention medium)
❌ "Task object created in database with ID abc-123"

Greeting Handling:
- Respond warmly to "hi"/"hello"/"hey" with offer to help
- Acknowledge "thank you"/"thanks" politely
- For "what can you do?", list your 5 capabilities

Off-Topic Handling:
If asked about weather, jokes, cooking, or anything outside task management, politely decline:
"I'm specialized in task management and can't help with that. I can help you add, view, complete, delete, or update tasks. Would you like to manage your tasks?"

Error Handling:
- Task not found: Suggest viewing current tasks
- Permission denied: Explain user can only access their own tasks
- Validation errors: Explain what went wrong and suggest correction
- Keep error messages brief and actionable
"""


def create_model(provider: Optional[str] = None, model: Optional[str] = None):
    """
    Create AI model instance with multi-provider support.

    Supports: OpenAI, Gemini, Groq, OpenRouter

    Args:
        provider: Model provider ("openai" | "gemini" | "groq" | "openrouter")
                 Default: LLM_PROVIDER env var or "openai"
        model: Model name (overrides provider default model)

    Returns:
        OpenAIChatCompletionsModel configured for selected provider

    Raises:
        ValueError: If provider unsupported or API key missing

    Reference: openai-agents-mcp-integration skill section 3.1

    Configuration (from settings):
        AI_PROVIDER or LLM_PROVIDER: Provider selection (default: "openai")
        OPENAI_API_KEY: Required for provider="openai"
        GEMINI_API_KEY: Required for provider="gemini"
        GROQ_API_KEY: Required for provider="groq"
        OPENROUTER_API_KEY: Required for provider="openrouter"
    """
    settings = get_settings()
    provider = provider or (settings.AI_PROVIDER or settings.LLM_PROVIDER or "openai").lower()

    if provider == "openai":
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is required when LLM_PROVIDER=openai. "
                "Set it in .env file or export OPENAI_API_KEY=sk-..."
            )

        client = AsyncOpenAI(api_key=api_key)
        model_name = model or settings.AI_MODEL
        return OpenAIChatCompletionsModel(model=model_name, openai_client=client)

    elif provider == "gemini":
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is required when LLM_PROVIDER=gemini. "
                "Get your API key from https://ai.google.dev/ and set GEMINI_API_KEY=..."
            )

        # Gemini via OpenAI-compatible API
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )
        model_name = model or settings.GEMINI_DEFAULT_MODEL
        return OpenAIChatCompletionsModel(model=model_name, openai_client=client)

    elif provider == "groq":
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY environment variable is required when LLM_PROVIDER=groq. "
                "Get your API key from https://console.groq.com/ and set GROQ_API_KEY=gsk_..."
            )

        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        model_name = model or settings.GROQ_DEFAULT_MODEL
        return OpenAIChatCompletionsModel(model=model_name, openai_client=client)

    elif provider == "openrouter":
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable is required when LLM_PROVIDER=openrouter. "
                "Get your API key from https://openrouter.ai/ and set OPENROUTER_API_KEY=sk-or-v1-..."
            )

        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        model_name = model or settings.OPENROUTER_DEFAULT_MODEL
        return OpenAIChatCompletionsModel(model=model_name, openai_client=client)

    else:
        raise ValueError(
            f"Unsupported provider: {provider}. "
            f"Supported providers: openai, gemini, groq, openrouter. "
            f"Set LLM_PROVIDER environment variable to one of these values."
        )


class TodoAgent:
    """
    AI agent for task management with MCP tool integration.

    Singleton or dependency injection pattern for FastAPI endpoints.

    Reference: openai-agents-mcp-integration skill section 3.2
    """

    def __init__(self, provider: Optional[str] = None):
        """
        Initialize agent with model and MCP server.

        Args:
            provider: Model provider (default: "openai")
        """
        # Create model
        self.model = create_model(provider=provider)

        # Configure MCP server with 30-second timeout (critical for tool execution)
        self.mcp_server = MCPServerStdio(
            name=os.getenv("MCP_SERVER_NAME", "todo-task-server"),
            params={
                "command": "python",
                "args": ["-m", "mcp_server"],
                "env": os.environ.copy()
            },
            client_session_timeout_seconds=30.0  # Increase from default 5s
        )

        # Create agent with tools and personality
        self.agent = Agent(
            name="TodoAgent",
            model=self.model,
            instructions=AGENT_INSTRUCTIONS,
            mcp_servers=[self.mcp_server],
            model_settings=ModelSettings(
                parallel_tool_calls=False  # Execute tools sequentially for clarity
            )
        )

    def get_agent(self) -> Agent:
        """Get configured agent instance."""
        return self.agent

    def get_mcp_server(self) -> MCPServerStdio:
        """Get MCP server instance (needed for context manager)."""
        return self.mcp_server


# Singleton instance for FastAPI dependency injection
_todo_agent_instance: Optional[TodoAgent] = None


def get_todo_agent() -> TodoAgent:
    """
    Get or create singleton TodoAgent instance.

    Returns:
        TodoAgent instance
    """
    global _todo_agent_instance
    if _todo_agent_instance is None:
        _todo_agent_instance = TodoAgent()
    return _todo_agent_instance


# **Phase III: Todo AI Chatbot**

*Basic Level Functionality*

**Objective:** Create an AI-powered chatbot interface for managing todos through natural language using MCP (Model Context Protocol) server architecture and using Claude Code and Spec-Kit Plus.

💡**Development Approach:** Use the [Agentic Dev Stack workflow](#the-agentic-dev-stack:-agents.md-+-spec-kitplus-+-claude-code): Write spec → Generate plan → Break into tasks → Implement via Claude Code. No manual coding allowed. We will review the process, prompts, and iterations to judge each phase and project.

# **Requirements**

1. Implement conversational interface for all Basic Level features  
2. Use OpenAI Agents SDK for AI logic  
3. Build MCP server with Official MCP SDK that exposes task operations as tools  
4. Stateless chat endpoint that persists conversation state to database  
5. AI agents use MCP tools to manage tasks. The MCP tools will also be stateless and will store state in the database. 

# **Technology Stack**

| Component | Technology |
| :---- | :---- |
| Frontend | OpenAI ChatKit |
| Backend | Python FastAPI |
| AI Framework | OpenAI Agents SDK |
| MCP Server | Official MCP SDK |
| ORM | SQLModel |
| Database | Neon Serverless PostgreSQL |
| Authentication | Better Auth |

# **Architecture**

┌─────────────────┐     ┌──────────────────────────────────────────────┐     ┌─────────────────┐  
│                 │     │              FastAPI Server                   │     │                 │  
│                 │     │  ┌────────────────────────────────────────┐  │     │                 │  
│  ChatKit UI     │────▶│  │         Chat Endpoint                  │  │     │    Neon DB      │  
│  (Frontend)     │     │  │  POST /api/chat                        │  │     │  (PostgreSQL)   │  
│                 │     │  └───────────────┬────────────────────────┘  │     │                 │  
│                 │     │                  │                           │     │  \- tasks        │  
│                 │     │                  ▼                           │     │  \- conversations│  
│                 │     │  ┌────────────────────────────────────────┐  │     │  \- messages     │  
│                 │◀────│  │      OpenAI Agents SDK                 │  │     │                 │  
│                 │     │  │      (Agent \+ Runner)                  │  │     │                 │  
│                 │     │  └───────────────┬────────────────────────┘  │     │                 │  
│                 │     │                  │                           │     │                 │  
│                 │     │                  ▼                           │     │                 │  
│                 │     │  ┌────────────────────────────────────────┐  │────▶│                 │  
│                 │     │  │         MCP Server                 │  │     │                 │  
│                 │     │  │  (MCP Tools for Task Operations)       │  │◀────│                 │  
│                 │     │  └────────────────────────────────────────┘  │     │                 │  
└─────────────────┘     └──────────────────────────────────────────────┘     └─────────────────┘

# **Database Models**

| Model | Fields | Description |
| :---- | :---- | :---- |
| **Task** | user\_id, id, title, description, completed, created\_at, updated\_at | Todo items |
| **Conversation** | user\_id, id, created\_at, updated\_at | Chat session |
| **Message** | user\_id, id, conversation\_id, role (user/assistant), content, created\_at | Chat history |

# **Chat API Endpoint**

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| POST | /api/{user\_id}/chat | Send message & get AI response |

## **Request**

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| conversation\_id | integer | No | Existing conversation ID (creates new if not provided) |
| message | string | Yes | User's natural language message |

## **Response**

| Field | Type | Description |
| :---- | :---- | :---- |
| conversation\_id | integer | The conversation ID |
| response | string | AI assistant's response |
| tool\_calls | array | List of MCP tools invoked |

# **MCP Tools Specification**

The MCP server must expose the following tools for the AI agent:

## **Tool: add\_task**

| Purpose | Create a new task |
| :---- | :---- |
| **Parameters** | user\_id (string, required), title (string, required), description (string, optional) |
| **Returns** | task\_id, status, title |
| **Example Input** | {“user\_id”: “ziakhan”, "title": "Buy groceries", "description": "Milk, eggs, bread"} |
| **Example Output** | {"task\_id": 5, "status": "created", "title": "Buy groceries"} |

## **Tool: list\_tasks**

| Purpose | Retrieve tasks from the list |
| :---- | :---- |
| **Parameters** | status (string, optional: "all", "pending", "completed") |
| **Returns** | Array of task objects |
| **Example Input** | {user\_id (string, required), "status": "pending"} |
| **Example Output** | \[{"id": 1, "title": "Buy groceries", "completed": false}, ...\] |

## **Tool: complete\_task**

| Purpose | Mark a task as complete |
| :---- | :---- |
| **Parameters** | user\_id (string, required), task\_id (integer, required) |
| **Returns** | task\_id, status, title |
| **Example Input** | {“user\_id”: “ziakhan”, "task\_id": 3} |
| **Example Output** | {"task\_id": 3, "status": "completed", "title": "Call mom"} |

## **Tool: delete\_task**

| Purpose | Remove a task from the list |
| :---- | :---- |
| **Parameters** | user\_id (string, required), task\_id (integer, required) |
| **Returns** | task\_id, status, title |
| **Example Input** | {“user\_id”: “ziakhan”, "task\_id": 2} |
| **Example Output** | {"task\_id": 2, "status": "deleted", "title": "Old task"} |

## **Tool: update\_task**

| Purpose | Modify task title or description |
| :---- | :---- |
| **Parameters** | user\_id (string, required), task\_id (integer, required), title (string, optional), description (string, optional) |
| **Returns** | task\_id, status, title |
| **Example Input** | {“user\_id”: “ziakhan”, "task\_id": 1, "title": "Buy groceries and fruits"} |
| **Example Output** | {"task\_id": 1, "status": "updated", "title": "Buy groceries and fruits"} |

# **Agent Behavior Specification**

| Behavior | Description |
| :---- | :---- |
| **Task Creation** | When user mentions adding/creating/remembering something, use add\_task |
| **Task Listing** | When user asks to see/show/list tasks, use list\_tasks with appropriate filter |
| **Task Completion** | When user says done/complete/finished, use complete\_task |
| **Task Deletion** | When user says delete/remove/cancel, use delete\_task |
| **Task Update** | When user says change/update/rename, use update\_task |
| **Confirmation** | Always confirm actions with friendly response |
| **Error Handling** | Gracefully handle task not found and other errors |

# 

# **Conversation Flow (Stateless Request Cycle)**

1. Receive user message  
2. Fetch conversation history from database  
3. Build message array for agent (history \+ new message)  
4. Store user message in database  
5. Run agent with MCP tools  
6. Agent invokes appropriate MCP tool(s)  
7. Store assistant response in database  
8. Return response to client  
9. Server holds NO state (ready for next request)

# **Natural Language Commands**

The chatbot should understand and respond to:

| User Says | Agent Should |
| :---- | :---- |
| "Add a task to buy groceries" | Call add\_task with title "Buy groceries" |
| "Show me all my tasks" | Call list\_tasks with status "all" |
| "What's pending?" | Call list\_tasks with status "pending" |
| "Mark task 3 as complete" | Call complete\_task with task\_id 3 |
| "Delete the meeting task" | Call list\_tasks first, then delete\_task |
| "Change task 1 to 'Call mom tonight'" | Call update\_task with new title |
| "I need to remember to pay bills" | Call add\_task with title "Pay bills" |
| "What have I completed?" | Call list\_tasks with status "completed" |

# **Deliverables**

1. GitHub repository with:  
* /frontend – ChatKit-based UI  
* /backend – FastAPI \+ Agents SDK \+ MCP  
* /specs – Specification files for agent and MCP tools  
* Database migration scripts  
* README with setup instructions  
    
2. Working chatbot that can:  
* Manage tasks through natural language via MCP tools  
* Maintain conversation context via database (stateless server)  
* Provide helpful responses with action confirmations  
* Handle errors gracefully  
* Resume conversations after server restart

# **OpenAI ChatKit Setup & Deployment**

## **Domain Allowlist Configuration (Required for Hosted ChatKit)**

Before deploying your chatbot frontend, you must configure OpenAI's domain allowlist for security:

1. **Deploy your frontend first to get a production URL:**  
-  Vercel: \`https://your-app.vercel.app\`  
-  GitHub Pages: \`https://username.github.io/repo-name\`  
-  Custom domain: \`https://yourdomain.com\`

2. **Add your domain to OpenAI's allowlist:**  
- Navigate to: [https://platform.openai.com/settings/organization/security/domain-allowlist](https://platform.openai.com/settings/organization/security/domain-allowlist)  
- Click "Add domain"  
- Enter your frontend URL (without trailing slash)  
- Save changes

3. **Get your ChatKit domain key:**  
- After adding the domain, OpenAI will provide a domain key  
- Pass this key to your ChatKit configuration

## **Environment Variables**

NEXT\_PUBLIC\_OPENAI\_DOMAIN\_KEY=your-domain-key-here

*Note: The hosted ChatKit option only works after adding the correct domains under Security → Domain Allowlist. Local development (\`localhost\`) typically works without this configuration.*

# **Key Architecture Benefits**

| Aspect | Benefit |
| :---- | :---- |
| **MCP Tools** | Standardized interface for AI to interact with your app |
| **Single Endpoint** | Simpler API — AI handles routing to tools |
| **Stateless Server** | Scalable, resilient, horizontally scalable |
| **Tool Composition** | Agent can chain multiple tools in one turn |

### **Key Stateless Architecture Benefits**

* **Scalability:** Any server instance can handle any request  
* **Resilience:** Server restarts don't lose conversation state  
* **Horizontal scaling:** Load balancer can route to any backend  
* **Testability:** Each request is independent and reproducible

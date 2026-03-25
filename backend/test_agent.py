import sys
import asyncio
from dotenv import load_dotenv

load_dotenv()
sys.path.append('.')

from api.dependencies import doc_repo, chat_repo, adzuna_client
from infrastructure.agent import llm
from application.agent_service import create_agent

async def main():
    agent, history = create_agent("test_user", doc_repo, chat_repo, adzuna_client, llm, "test_chat")
    print("Initiating test chat...")
    handler = agent.run(user_msg="Trova offerte di lavoro per python developer", chat_history=[])
    res = await handler
    print("\nFINAL RESPONSE:\n", res.response.content)

if __name__ == "__main__":
    asyncio.run(main())

from typing import Optional
from domain.models import ChatMessage
from domain.interfaces import IChatRepository, IDocumentRepository, IJobSearchClient
from application.agent_service import create_agent


# This service will be used by the FastAPI routes
class CareerService:
    def __init__(
        self, 
        chat_repo: IChatRepository, 
        doc_repo: IDocumentRepository,
        job_offer_repo: IJobSearchClient,
        llm
    ):
        self.chat_repo = chat_repo
        self.doc_repo = doc_repo
        self.job_offer_repo = job_offer_repo
        self.llm = llm
    

    async def chat_with_agent(self, user_id: str, message: str, chat_id: Optional[str] = None) -> str:
        
        # 1. Initialize agent and load history from DB
        agent, chat_history = create_agent(user_id, self.doc_repo, self.chat_repo, self.job_offer_repo, self.llm, chat_id)
        
        # 2. Run agent with message and history injected into its context
        handler = agent.run(user_msg=message, chat_history=chat_history)
        response_obj = await handler
        response_text = str(response_obj.response.content)

        # 3. Save user message
        user_msg = ChatMessage(uid=user_id, role="user", message=message, chat_id=chat_id)
        self.chat_repo.save(user_msg)

        # 4. Save agent response
        assistant_msg = ChatMessage(uid=user_id, role="assistant", message=response_text, chat_id=chat_id)
        self.chat_repo.save(assistant_msg)

        return response_text

    async def stream_chat_with_agent(self, user_id: str, message: str, chat_id: Optional[str] = None):
        from llama_index.core.agent.workflow.workflow_events import AgentStream

        # 1. Build agent + load history
        agent, chat_history = create_agent(user_id, self.doc_repo, self.chat_repo, self.job_offer_repo, self.llm, chat_id)

        # 2. Start the run — get a streaming handler
        handler = agent.run(user_msg=message, chat_history=chat_history)

        full_answer = ""
        buffer = ""
        found_answer = False

        # 3. Stream token deltas as SSE events
        async for event in handler.stream_events():
            if isinstance(event, AgentStream) and event.delta:
                buffer += event.delta
                
                if found_answer:
                    # We are already in the answer part, just yield the delta
                    full_answer += event.delta
                    safe_delta = event.delta.replace("\n", "\\n") 
                    yield f"data: {safe_delta}\n\n"
                elif "Answer:" in buffer:
                    # We just found "Answer:", start yielding from here
                    found_answer = True
                    # Get everything after "Answer:"
                    parts = buffer.split("Answer:", 1)
                    answer_start = parts[1].lstrip() # Remove leading space after "Answer:"
                    if answer_start:
                        full_answer += answer_start
                        safe_answer_start = answer_start.replace("\n", "\\n")
                        yield f"data: {safe_answer_start}\n\n"

        # 4. Signal end of stream
        yield "data: [DONE]\n\n"

        # 5. Save messages to DB after streaming completes
        user_msg_obj = ChatMessage(uid=user_id, role="user", message=message, chat_id=chat_id)
        self.chat_repo.save(user_msg_obj)

        if full_answer:
            assistant_msg = ChatMessage(uid=user_id, role="assistant", message=full_answer, chat_id=chat_id)
            self.chat_repo.save(assistant_msg)
        elif buffer and not found_answer:
            # Fallback: if "Answer:" was never found but we got some text, 
            # it might be a model that didn't follow the ReAct format exactly.
            # In that case, we yield the whole buffer at the end or save it.
            # But usually ReActAgent handles this in finalize.
            # Let's check if the handler has a result yet.
            res = await handler
            final_text = str(res.response.content)
            if final_text:
                safe_final_text = final_text.replace("\n", "\\n")
                yield f"data: {safe_final_text}\n\n"
                assistant_msg = ChatMessage(uid=user_id, role="assistant", message=final_text, chat_id=chat_id)
                self.chat_repo.save(assistant_msg)

    def get_user_chat_history(self, user_id: str):
        return self.chat_repo.get_history(user_id)

    def get_chat_messages(self, user_id: str, chat_id: str):
        return self.chat_repo.get_chat_messages(user_id, chat_id)

from typing import List, Optional
from domain.interfaces import IDocumentRepository, IChatRepository, IJobSearchClient
from llama_index.core.tools import FunctionTool
from llama_index.core.agent.workflow import ReActAgent
import os
import pandas as pd
import sys
import logging
from llama_index.core.callbacks import CallbackManager, LlamaDebugHandler
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.llms import ChatMessage as LlamaChatMessage, MessageRole

llama_debug = LlamaDebugHandler(print_trace_on_end=True)
callback_manager = CallbackManager([llama_debug])

logging.getLogger("llama_index").setLevel(logging.DEBUG)

# CREATE AGENT 
def create_agent(user_id: str, doc_repo: IDocumentRepository, chat_repo: IChatRepository, job_client: IJobSearchClient, llm, chat_id: Optional[str] = None):

    # 1. Get chat history for context (only for the current session)
    if chat_id:
        history = chat_repo.get_chat_messages(user_id, chat_id)
    else:
        # Fallback to no history if no chat_id provided
        history = []


    # 2. Format history for LLM
    chat_history = []

    #docs = doc_repo.get_by_user(user_id)
    #if docs:
    #    cv_text = "\n\n".join(doc.content for doc in docs)
    #    chat_history.append(LlamaChatMessage(
    #        role=MessageRole.SYSTEM,
    #        content=f"The user has uploaded this CV: {cv_text}"
    #    ))

    for msg in history:
        if msg.role == "user":
            chat_history.append(LlamaChatMessage(role=MessageRole.USER, content=msg.message))
        else:
            chat_history.append(LlamaChatMessage(role=MessageRole.ASSISTANT, content=msg.message))
    history_text = "\n".join([f"{m.role}: {m.message}" for m in history])

    # 3. Initialize memory with chat history
    memory = ChatMemoryBuffer.from_defaults(
        chat_history = chat_history,
        token_limit = 6000
    )

    # TOOLS
    def get_documents_tool():
        docs = doc_repo.get_by_user(user_id)
        if not docs:
            return "No documents found"
        return "\n\n".join(doc.content for doc in docs)

    def analyze_document_tool(doc_text: str) -> str:
        prompt = f"""Analyze this document and extract:
        - Education
        - Skills
        - Work experience
        - Projects
        - Certifications
        - Languages
        - Interests
        - Strengths
        - Weaknesses
        - Goals
        - Hobbies

        document: {doc_text}
        """
        response = llm.predict(prompt)
        return response

    def get_chat_history_tool():
        chats = chat_repo.get_history(user_id)
        if not chats:
            return "No chat history found"
        return [f"{c.role}: {c.message}" for c in chats]

    #def get_job_offers_tool(query: str):
    #    results = job_client.search_jobs(query)
    #    if not results:
    #       return "No job offers found."
    #    return results
    
    #def get_job_offers_tool(query: str) -> str:
    #    print(f"🔍 SEARCHING JOBS: {query}")  # ← aggiungi questo
    #    results = job_client.search_jobs(query)
    #    print(f"📋 RESULTS: {results}")  # ← e questo
    #    if not results:
    #        return "No job offers found."
    #    output = "Here are the job offers I found:\n"
    #    for idx, job in enumerate(results):
    #        output += f"{idx+1}. Title: {job.get('title')}\nCompany: {job.get('company')}\nLocation: {job.get('location')}\nLink: {job.get('url')}\n\n"
    #    return output

    def get_job_offers_tool(query: str) -> str:
        # Pulisce la query da parole che rompono le API e tiene solo 2 parole chiave
        import re
        clean_query = re.sub(r'(?i)\b(junior|senior|internship|remote|italy|milano|roma|in|a|per|di)\b', '', query)
        words = [w for w in clean_query.split() if len(w) > 1][:2]
        final_query = " ".join(words) if words else query.split()[0]
        
        print(f"🔍 SEARCHING JOBS: {final_query} (original: {query})")
        results = job_client.search_jobs(final_query)[:3]
        print(f"📋 RESULTS: {results}")
        if not results:
            return "No job offers found."
        output = "Ecco le offerte che ho trovato:\n\n"
        for job in results:
            output += f"- **{job.get('title')}** presso {job.get('company')} ({job.get('location')}) - [Clicca qui per l'annuncio]({job.get('url')})\n"
        return output

    def read_csv_tool(filename: str):
        """Reads a CSV file from the data directory. Valid files: Occupation_Skill.csv Skill_Growth.csv Growth_projection.csv"""
        try:
            # Construct path relative to backend directory
            filepath = os.path.join("data", filename)
            df = pd.read_csv(filepath)
            # Return only first 10 rows to stay within token limits
            return df.head(10).to_string()
        except Exception as e:
            return f"Error reading CSV: {str(e)}"       
        
    tools = [
        FunctionTool.from_defaults(fn=get_documents_tool, name="get_documents", description="Retrieves the full text of all documents uploaded by the user (CV, resume, cover letter). Call this whenever a new document is uploaded or when you need up-to-date background info."),
        FunctionTool.from_defaults(fn=analyze_document_tool, name="analyze_document", description="Takes raw CV/document text as input and extracts structured info: skills, education, experience, strengths, weaknesses. Use AFTER get_documents."),
        FunctionTool.from_defaults(fn=get_chat_history_tool, name="get_chat_history", description="Returns previous conversation messages. Use only if the user refers to something said earlier that is not in current context."),
        FunctionTool.from_defaults(fn=get_job_offers_tool, name="get_job_offers", description="Searches live job listings. Input should be a short English job title (e.g. 'python developer'). Call this WHENEVER the user asks for jobs!"),
        FunctionTool.from_defaults(fn=read_csv_tool, name="read_csv", description="Reads labor market data from CSV files. Available files: Occupation_Skill.csv (skills per job role), Skill_Growth.csv (growing skills), Growth_projection.csv (job demand forecasts). Use when user asks about market trends or skill gaps.")
    ]
    # Pre-load CV into system prompt to prevent the LLM from forgetting it
    docs = doc_repo.get_by_user(user_id)
    cv_context = ""
    if docs:
        cv_text = "\n\n".join(doc.content for doc in docs)
        cv_context = f"\n\n## USER'S CV:\nThe user has already uploaded their CV. Here is the text:\n{cv_text}\n(Do not ask the user for their CV again, you already have it.)\n"

    # Create agent
    agent = ReActAgent(
        tools=tools, 
        llm=llm, 
        memory=memory,
        verbose=True,
        system_prompt=f"""

CRITICAL: You are ONLY a career advisor specialized exclusively in:
jobs, careers, CVs/resumes, job offers, interviews, salaries, and professional skills. 
For ANY non-career topic respond with exactly: "I can only help with career and job-related questions."
Nothing else. No explanation. No partial help.
{cv_context}

##TOOL USAGE — MANDATORY:
- ALWAYS call get_job_offers when user asks for jobs. Never skip it. Never answer without calling it first.
- ALWAYS call get_documents at the start of every conversation.
- CRITICAL: The length rules (max 3 sentences) do NOT apply to your internal thoughts. You are free to think and plan as long as needed. ONLY limit your final response to the user.

## LANGUAGE
Always respond in the same language the user writes in.

RESPONSE RULES:
- Maximum 3 sentences per response. Never exceed this.
- max 80 words per response.
- Never use 1) 2) 3) for lists. Use - only.
- Maximum 3 bullet points. Never more.
- No nested bullets.
- Never start with "Certainly!", "Sure!", "Great question!" or similar.
- Go straight to the answer.
- Always end with ONE question maximum.

CV RULES:
- Call get_documents at the start of every conversation.
- If CV found: use it for all recommendations. Do not retrieve again.
- If CV not found: ask "Could you upload your CV so I can help you better?"

JOB SEARCH RULES:
- ALWAYS call get_job_offers IMMEDIATELY when the user asks for jobs. Do NOT ask for locations or seniority before calling the tool. Call the tool immediately with a general query to show examples first, then optionally ask if they want to refine.
- NEVER invent jobs. ONLY show the exact jobs returned by the tool. If the tool returns 1 job, show 1 job. If the tool returns 2 jobs, show 2 jobs.
- Pass ONLY the core role (1-2 words) to the tool. Do not pass locations or seniority.

- CRITICAL FORMATTING: DO NOT format the jobs yourself. You MUST copy-paste the EXACT bullet points returned by the get_job_offers tool (which perfectly contain the Markdown links `[Clicca qui...](url)`). DO NOT translate or alter the tool's text. NEVER use plaintext URLs like "Annuncio: https...". Just verbatim echo the tool's output.

HALLUCINATION PREVENTION:
- If get_job_offers says "No job offers found", DO NOT invent fake jobs. Just say you couldn't find any.
- If read_csv returns an error, DO NOT invent statistics. Say you can't access the data right now.

CV ANALYSIS:
- Call analyze_document after get_documents.
- Give exactly 2 strengths and 1 area to improve.
- Maximum 3 sentences total.

CONVERSATION STYLE:
- Never give a complete answer in one message.
- Share one piece of information, then ask one question.
- Example:
  "Your CV shows strong automation skills. Are you looking to stay in this field or transition to something new?"
  → wait for answer →
  "Got it. Here are 3 roles that match your profile: ..."
""",
callback_manager=callback_manager
    )
    return agent, chat_history

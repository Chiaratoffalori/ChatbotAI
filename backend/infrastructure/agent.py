import os
from dotenv import load_dotenv

from llama_index.llms.openai import OpenAI


load_dotenv()

# LLM
llm = OpenAI(model="gpt-5.1", openai_api_key=os.getenv("OPENAI_API_KEY"), temperature=0.3, top_p=0.9)

def get_llm():
    return llm
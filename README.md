# AIChatbot for Career Guidance

Full-stack project that integrates a **Python backend with FastAPI** and a **Next.js/React frontend**, with authentication and database management via **Firebase** and **MongoDB**.  

---

## Setup

### Backend

1. Create a virtual environment:
```bash
python -m venv venv
# Attivazione ambiente
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows
```

2. Install dependencies:
```bash
pip install -r backend/requirements.txt
```

3. Start the server:
```bash
uvicorn backend.main:app --reload
```
----
### Frontend
1. Install dependencies:
```bash
cd frontend
npm install
```
3. Start the app:
```bash
npm run dev
```

----
## API Keys Configuration

To run the project, create a .env file or export the required environment variables:

```bash
# macOS/Linux
export OPENAI_API_KEY="la_tua_chiave_openai"
export ADZUNA_API_KEY="la_tua_chiave_adzuna"
export GOOGLE_APPLICATION_CREDENTIALS="path/al/tuo/serviceAccountKey.json"

# Windows (PowerShell)
setx OPENAI_API_KEY "la_tua_chiave_openai"
setx ADZUNA_API_KEY "la_tua_chiave_adzuna"
setx GOOGLE_APPLICATION_CREDENTIALS "path\al\tuo\serviceAccountKey.json"
```

---
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![LlamaIndex](https://img.shields.io/badge/LlamaIndex-LLAMA-7D3C98?style=for-the-badge&logo=data&logoColor=white)
![OpenAI GPT](https://img.shields.io/badge/OpenAI-GPT-412991?style=for-the-badge&logo=openai&logoColor=white)

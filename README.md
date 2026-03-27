# AIChatbot for Career Guidance

Progetto full-stack che integra un **backend Python con FastAPI** e un **frontend Next.js/React**, con gestione autenticazione e database tramite **Firebase** e **MongoDB**.  

---

## Setup

### Backend

1. Creare un ambiente virtuale:
```bash
python -m venv venv
# Attivazione ambiente
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows
```

2. Installare le dipendenze:
```bash
pip install -r backend/requirements.txt
```

3. Avviare il server:
```bash
uvicorn backend.main:app --reload
```
----
### Frontend
1. Installare le dipendenze:
```bash
cd frontend
npm install
```
3. Avviare l’app:
```bash
npm run dev
```

----
## Configurazione chiavi API

Per far funzionare il progetto, crea un file `.env` o esporta le variabili d'ambiente necessarie:

```bash
# macOS/Linux
export OPENAI_API_KEY="la_tua_chiave_openai"
export ADZUNA_API_KEY="la_tua_chiave_adzuna"
export GOOGLE_APPLICATION_CREDENTIALS="path/al/tuo/serviceAccountKey.json"

# Windows (PowerShell)
setx OPENAI_API_KEY "la_tua_chiave_openai"
setx ADZUNA_API_KEY "la_tua_chiave_adzuna"
setx GOOGLE_APPLICATION_CREDENTIALS "path\al\tuo\serviceAccountKey.json"

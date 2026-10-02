import os

from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/ethara_team_task_manager")
JWT_SECRET = os.getenv("JWT_SECRET", "")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "10080"))
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173")
AI_PROVIDER = os.getenv("AI_PROVIDER", "demo").lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL")

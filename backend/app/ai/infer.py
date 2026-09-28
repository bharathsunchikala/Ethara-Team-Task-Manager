from functools import lru_cache
from pathlib import Path

import joblib

MODEL_PATH = Path(__file__).with_name("model.joblib")


@lru_cache(maxsize=1)
def _load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Recommendation model is not trained yet")
    return joblib.load(MODEL_PATH)


def recommend_with_confidence(description: str) -> tuple[str, float]:
    model = _load_model()
    probabilities = model.predict_proba([description])[0]
    winner = int(probabilities.argmax())
    return str(model.classes_[winner]), float(probabilities[winner])


def recommend_assignee(description: str) -> str:
    return recommend_with_confidence(description)[0]

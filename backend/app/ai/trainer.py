from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

DATA_PATH = Path(__file__).with_name("tasks_training.csv")
MODEL_PATH = Path(__file__).with_name("model.joblib")


def train_model() -> Path:
    data = pd.read_csv(DATA_PATH)
    if not {"description", "assignee_id"}.issubset(data.columns):
        raise ValueError("Training CSV must contain description and assignee_id columns")
    data = data.dropna(subset=["description", "assignee_id"])
    if data["assignee_id"].nunique() < 2:
        raise ValueError("Training data must contain at least two distinct assignees")
    model = make_pipeline(
        TfidfVectorizer(ngram_range=(1, 2), max_features=10000),
        LogisticRegression(max_iter=1000),
    )
    model.fit(data["description"].astype(str), data["assignee_id"].astype(str))
    joblib.dump(model, MODEL_PATH)
    return MODEL_PATH


if __name__ == "__main__":
    print(f"Saved recommendation model to {train_model()}")

import joblib
import numpy as np
import os
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

# Features:
# 0: team_size (1-4)
# 1: timeframe_weeks (8-24)
# 2: hardware_match (1.0 = full match, 0.5 = partial match, 0.0 = conflict)
# 3: skill_gap_severity (0 - 15)
# 4: component_count (2 - 7)
# 5: novel_algorithm_required (0 or 1)

np.random.seed(42)
N = 80
team_sizes = np.random.choice([1, 2, 3, 4], size=N, p=[0.25, 0.40, 0.25, 0.10])
timeframes = np.random.choice([10, 12, 14, 16, 18, 20, 24], size=N)
hw_matches = np.random.choice([1.0, 0.7, 0.3], size=N, p=[0.7, 0.2, 0.1])
skill_gaps = np.random.choice([0, 1, 2, 3, 4, 6, 8, 10, 12], size=N, p=[0.15, 0.20, 0.20, 0.15, 0.10, 0.08, 0.06, 0.04, 0.02])
comp_counts = np.random.choice([2, 3, 4, 5, 6], size=N)
novel_algs = np.random.choice([0, 1], size=N, p=[0.45, 0.55])

X = np.column_stack([team_sizes, timeframes, hw_matches, skill_gaps, comp_counts, novel_algs])

# Ground truth outcome simulation based on empirical engineering capstone factors
# Team size helps larger component counts; large gaps + short timeframes fail; hardware mismatches hurt
z = (
    0.8 * (team_sizes - 1)
    + 0.15 * (timeframes - 14)
    + 2.5 * (hw_matches - 0.7)
    - 0.45 * skill_gaps
    - 0.5 * (comp_counts - 3)
    - 0.7 * novel_algs
    + 0.5
)
prob = 1.0 / (1.0 + np.exp(-z))
y = (prob >= 0.5).astype(int)

# Train Logistic Regression
clf = LogisticRegression(random_state=42)
clf.fit(X, y)
acc = accuracy_score(y, clf.predict(X))

out_path = "backend/data/feasibility_model.joblib"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
joblib.dump({
    "model": clf,
    "feature_names": ["team_size", "timeframe_weeks", "hardware_match", "skill_gap_severity", "component_count", "novel_algorithm_required"],
    "accuracy": acc,
    "version": "1.0.0"
}, out_path)

print(f"Trained and saved Feasibility ML model to {out_path} with training accuracy: {acc:.2%}")

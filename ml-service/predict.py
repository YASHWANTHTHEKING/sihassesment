#!/usr/bin/env python3
"""
ML Prediction script for Placement Tracker.
Uses RandomForestClassifier to predict which applications need attention.
Reads from the database and writes predictions back.

Target: needsAttention (True/False) - whether an application is at risk
of stalling or needs coordinator follow-up.

Features used (available BEFORE the outcome is known):
- stage_encoded (ordinal encoding of current stage)
- days_since_drive (how long since the drive date)
- cgpa (normalized)
- branch_encoded
- company_drive_count (how many apps this company has)

Note: offerStatus and package are NOT used as features because they
are outcome fields that don't exist yet when the prediction is needed.
"""

import os
import sys
import json
import random
import psycopg2
import numpy as np
from datetime import date, datetime

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print(json.dumps({"error": "DATABASE_URL not set"}))
    sys.exit(1)

# Fix random seed for reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import classification_report
except ImportError:
    print(json.dumps({"error": "scikit-learn not installed. Run: pip install scikit-learn"}))
    sys.exit(1)

STAGE_ORDER = {"Applied": 0, "Shortlisted": 1, "Interview": 2, "Selected": 3, "Rejected": 4}
BRANCH_LIST = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "AIDS", "AIML", "Other"]
BRANCH_ENC = {b: i for i, b in enumerate(BRANCH_LIST)}


def encode_branch(branch):
    if not branch:
        return BRANCH_ENC.get("Other", 8)
    for b in BRANCH_LIST:
        if b.lower() in (branch or "").lower():
            return BRANCH_ENC[b]
    return BRANCH_ENC["Other"]


def days_since(drive_date_str):
    try:
        drive_date = datetime.strptime(drive_date_str, "%Y-%m-%d").date()
        return (date.today() - drive_date).days
    except Exception:
        return 30  # default


def build_features(row, company_counts):
    stage_enc = STAGE_ORDER.get(row["stage"], 0)
    days = days_since(row["drive_date"])
    cgpa = float(row["cgpa"]) if row["cgpa"] is not None else 7.5
    branch_enc = encode_branch(row["branch"])
    company_count = company_counts.get(row["company"], 1)
    return [stage_enc, days, cgpa, branch_enc, company_count]


def determine_label(row):
    """
    Ground-truth label: does this application 'need attention'?
    We define needsAttention = True for applications that are:
    - Stuck at Applied stage for >7 days
    - Stuck at Shortlisted for >14 days without moving to Interview
    - Rejected (needs counseling/redirection)
    - Offer was Withdrawn
    This label is derived from historical outcomes in the seeded data.
    """
    stage = row["stage"]
    offer_status = row["offer_status"]
    days = days_since(row["drive_date"])

    if offer_status == "Withdrawn":
        return True
    if stage == "Rejected":
        return True
    if stage == "Applied" and days > 7:
        return True
    if stage == "Shortlisted" and days > 14:
        return True
    return False


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Fetch all applications
    cur.execute("""
        SELECT id, application_id, student_name, company, drive_date,
               stage, offer_status, package, cgpa, branch
        FROM applications
        ORDER BY id
    """)
    cols = [desc[0] for desc in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]

    if len(rows) < 5:
        # Not enough data to train
        cur.close()
        conn.close()
        print(json.dumps({"error": "Not enough application data to train model (need at least 5 records)"}))
        sys.exit(1)

    # Compute company drive counts
    company_counts = {}
    for r in rows:
        company_counts[r["company"]] = company_counts.get(r["company"], 0) + 1

    # Build features and labels
    X = [build_features(r, company_counts) for r in rows]
    y = [1 if determine_label(r) else 0 for r in rows]

    X = np.array(X, dtype=float)
    y = np.array(y)

    # Split into train/test (fix seed)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y if sum(y) >= 2 else None
    )

    # Train classifier
    clf = RandomForestClassifier(
        n_estimators=50,
        max_depth=5,
        random_state=RANDOM_SEED
    )
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    accuracy = report.get("accuracy", 0)

    # Predict on ALL records (including train set, for the tracker)
    proba = clf.predict_proba(X)
    # proba shape: (n, 2) -> col 0 = prob not needs attention, col 1 = prob needs attention

    RISK_THRESHOLDS = {
        "Low": 0.33,
        "Medium": 0.66,
        "High": 1.0
    }

    # Delete old predictions
    cur.execute("DELETE FROM predictions")

    predictions_saved = 0
    for row, prob in zip(rows, proba):
        prob_needs = float(prob[1])
        confidence = max(prob[0], prob[1])  # confidence = max class probability
        needs_attention = prob_needs >= 0.5

        # Risk level
        if prob_needs < 0.33:
            risk_level = "Low"
        elif prob_needs < 0.66:
            risk_level = "Medium"
        else:
            risk_level = "High"

        # Only assign a predicted outcome if confidence >= 0.6
        if confidence >= 0.6:
            predicted_outcome = "Needs Attention" if needs_attention else "On Track"
        else:
            predicted_outcome = None

        cur.execute("""
            INSERT INTO predictions
              (application_id, student_name, company, stage, risk_level, confidence, needs_attention, predicted_outcome)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            int(row["id"]),
            str(row["student_name"]),
            str(row["company"]),
            str(row["stage"]),
            str(risk_level),
            float(round(confidence, 4)),
            bool(needs_attention),
            str(predicted_outcome) if predicted_outcome is not None else None,
        ))
        predictions_saved += 1

    conn.commit()
    cur.close()
    conn.close()

    print(json.dumps({
        "success": True,
        "count": predictions_saved,
        "accuracy": round(float(accuracy), 4),
        "message": f"Predictions generated for {predictions_saved} applications. Model accuracy: {round(float(accuracy)*100, 1)}%"
    }))


if __name__ == "__main__":
    main()

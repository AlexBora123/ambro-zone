import pandas as pd
import numpy as np
from catboost import CatBoostClassifier

n_samples = 5000
np.random.seed(42)

lat_min, lat_max = 44.28, 44.35
lng_min, lng_max = 23.75, 23.85

data = {
    'lat': np.random.uniform(lat_min, lat_max, n_samples),
    'lng': np.random.uniform(lng_min, lng_max, n_samples),
    'polen_senzor': np.random.uniform(0, 100, n_samples), 
    'temp': np.random.uniform(15, 38, n_samples),
    'umiditate': np.random.uniform(20, 90, n_samples),
    'vant': np.random.uniform(0, 35, n_samples),
    'nr_rapoarte': np.random.randint(0, 50, n_samples)
}

df = pd.DataFrame(data)


def calculate_real_risk(row):
    score = 0
    if row['polen_senzor'] > 40: score += 0.5

    if row['nr_rapoarte'] > 15 and row['temp'] > 25: score += 0.4

    if row['vant'] > 15 and row['temp'] > 30: score += 0.2

    if row['umiditate'] < 35: score += 0.1

    if (row['lat'] > 44.33 or row['lat'] < 44.30): score += 0.1

    return 1 if score >= 0.6 else 0

df['target'] = df.apply(calculate_real_risk, axis=1)

X = df.drop('target', axis=1)
y = df['target']
model = CatBoostClassifier(
    iterations=500,
    depth=6,
    learning_rate=0.1,
    verbose=False,
    allow_writing_files=False
)

model.fit(X, y)

#model.save_model("model_ambrozie.cbm")
from flask import Flask, request, jsonify
import pandas as pd
import os
from sklearn.feature_extraction.text import CountVectorizer,TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask_cors import CORS
app = Flask(__name__)
CORS(app)


# Load and prepare job data
x = pd.read_csv('omg.csv')
x['tag'] = (
    x['Position']*3 + ' ' +      # Title is most important
    x['Company']*2 + ' ' +
    x['Location']*2 + ' ' +
    x['Job Type'] + ' ' +
    x['Pay'] + ' ' +
    x['Shift and Schedule'] + ' ' +
    x['Job Description']
)

x['ID'] = x['ID'].astype(int)

tfidf = TfidfVectorizer(max_features=2000, stop_words='english')
vector = tfidf.fit_transform(x['tag'].values.astype('U'))
similarity = cosine_similarity(vector)

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    previous_searches = data.get('previous_searches', [])
    top_n = data.get('top_n', 5)
    
    print("Received previous_searches from frontend:", previous_searches)  # <- Add this
    
    # Convert CSV IDs to integers (if not already)
    x['ID'] = x['ID'].astype(int)
    print("CSV IDs:", x['ID'].tolist())  # <- Add this
    
    if not previous_searches:
        return jsonify([])

    scores = []
    for job_id in previous_searches:
        # This will fail if job_id does not match any ID
        if job_id in x['ID'].values:
            idx = x[x['ID'] == job_id].index[0]
            scores.append(similarity[idx])
            print(f"Job ID {job_id} found at index {idx}")  # <- Add this
        else:
            print(f"Job ID {job_id} not found in CSV!")  # <- Add this

    if not scores:
        return jsonify([])

    avg_scores = sum(scores) / len(scores)  # This is a numpy array
    recommended_idx = avg_scores.argsort()[::-1]

    # Exclude previous searches
    recommended_idx = [i for i in recommended_idx if x.iloc[i]['ID'] not in previous_searches]

    # Take top_n recommendations
    recommended_jobs = x.iloc[recommended_idx[:top_n]].to_dict(orient='records')
    #recommended_jobs = x.iloc[recommended_idx[:top_n]].to_dict(orient='records')

    # Replace any NaN values with empty strings
    for job in recommended_jobs:
        for key, value in job.items():
            if value != value:  # NaN check: NaN != NaN
                job[key] = ''

    return jsonify(recommended_jobs)

    print("Recommended jobs:", [job['ID'] for job in recommended_jobs])
    return jsonify(recommended_jobs)



if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    



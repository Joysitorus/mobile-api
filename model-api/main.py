import json
from flask import Flask, jsonify, request
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer
import numpy as np
import pandas as pd
import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem.snowball import SnowballStemmer
from tensorflow.keras.models import load_model

nltk.download('stopwords')

app = Flask(__name__)

model = load_model('assign your model in here.')

def preprocess_text(text):
    stop_words = set(stopwords.words('english'))
    punctuations = set(string.punctuation)
    stop_words.update(punctuations)
    lemmatizer = SnowballStemmer(language='english')
    
    clean_text = re.sub('[^a-zA-Z]', ' ', text)
    clean_text = clean_text.lower().split()
    clean_text = [lemmatizer.stem(word) for word in clean_text if word not in stop_words]
    clean_text = ' '.join(clean_text)
    
    return clean_text

@app.route('/')
def index():
    return 'Hello!'

@app.route('/predictJob', methods=['POST'])
def predict_job():
    try:
        data = request.get_json(force=True)
        job_description = data.get('job_description', '')
        
        cleaned_text = preprocess_text(job_description)
        
        tokenizer = Tokenizer(num_words=5000)
        tokenizer.fit_on_texts([cleaned_text])
        
        sequence = tokenizer.texts_to_sequences([cleaned_text])
        padded_sequence = pad_sequences(sequence, padding='post', maxlen=100)
        
        prediction = model.predict(padded_sequence)
        
        if prediction[0][0] >= 0.5:
            result = "False Job Offer"
        else:
            result = "Genuine Job Offer"
        
        return jsonify({'prediction': result})

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
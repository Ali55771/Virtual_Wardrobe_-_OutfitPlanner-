# Combined imports from app.py and api.py
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
import random
import re
import traceback
import json
import csv
import os
from itertools import product
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from rembg import remove
from PIL import Image
from io import BytesIO
import base64
from flask_cors import CORS

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)
app.config["JSON_AS_ASCII"] = False

# --- Folder Setup ---
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["OUTPUT_FOLDER"] = OUTPUT_FOLDER

# --- Data Loading and Standardization (from api.py) ---
def load_data(file_path='refined_comprehensive_dataset.xlsx'):
    """Load and standardize the dataset."""
    if not os.path.exists(file_path):
        print(f"Error: The file '{file_path}' was not found.")
        return pd.DataFrame()
        
    try:
        excel_data = pd.ExcelFile(file_path)
        df = excel_data.parse(excel_data.sheet_names[0])
        
        if df.empty:
            print("Warning: Dataset is empty")
            return pd.DataFrame()
            
        df.columns = [re.sub(r'[^a-zA-Z0-9]+', '_', str(col)).lower().strip('_') for col in df.columns]
        
        string_columns = df.select_dtypes(include=['object']).columns
        df[string_columns] = df[string_columns].fillna('')
        
        print(f"Dataset loaded successfully with {len(df)} rows.")
        return df
        
    except Exception as e:
        print(f"Error loading dataset: {str(e)}")
        return pd.DataFrame()

rule_data = load_data()

# --- Helper Functions (from api.py) ---
def split_and_strip(s):
    if not isinstance(s, str) or not s.strip(): return []
    return [x.strip() for x in s.split(',') if x.strip()]

def find_diverse_outfits(pools, existing_outfits, num_needed, rejection_set):
    """Intelligently finds diverse outfits by gradually relaxing criteria."""
    recommendations = list(existing_outfits)
    seen_outfits = {tuple(rec) for rec in recommendations}

    for required_diff_count in [4, 3, 2, 1]:
        if len(recommendations) >= 3: break
        print(f"Seeking outfits with at least {required_diff_count} different attributes...")
        
        for _ in range(50):
            if len(recommendations) >= 3: break
            new_outfit = tuple(random.choice(pool) for pool in pools.values())
            
            if new_outfit in seen_outfits or new_outfit in rejection_set: continue

            is_diverse_enough = True
            if recommendations:
                for existing_outfit in recommendations:
                    diff_count = sum(1 for a, b in zip(new_outfit, existing_outfit) if a != b)
                    if diff_count < required_diff_count:
                        is_diverse_enough = False
                        break
            
            if is_diverse_enough:
                recommendations.append(new_outfit)
                seen_outfits.add(new_outfit)

    if len(recommendations) < 3:
        print("Diversity criteria not met, filling with any unique outfits...")
        for _ in range(100):
            if len(recommendations) >= 3: break
            new_outfit = tuple(random.choice(pool) for pool in pools.values())
            if new_outfit not in seen_outfits:
                recommendations.append(new_outfit)
                seen_outfits.add(new_outfit)

    return recommendations

def max_distinct_outfits(all_outfits, max_outfits=4, existing_outfits=None):
    """Sorts outfits by score and returns the top N outfits."""
    if not all_outfits:
        return []

    # Sort outfits by score in descending order
    sorted_outfits = sorted(all_outfits, key=lambda x: x.get('score', 0), reverse=True)

    # Return the top N outfits, where N is max_outfits
    return sorted_outfits[:max_outfits]

# --- Core Recommendation Logic (from api.py) ---
FEEDBACK_FILE = 'user_feedback.csv'
OUTFIT_FIELDS = ["Dress Type", "Dress Color", "Dress Fabric/Texture", "Shoes Type", "Shoes Color", "Upper Layer", "Upper Layer Color", "image_url"]

def get_recommendations(current_temp: str, gender: str, event: str, outfit: str, time_of_day: str) -> list[dict]:
    valid_genders = {'male', 'female'}
    gender = gender.lower() if gender else ''
    if gender not in valid_genders:
        print(f"Error: Invalid gender '{gender}'. Must be 'male' or 'female'.")
        return []

    rejection_set = set()
    if os.path.exists(FEEDBACK_FILE):
        try:
            feedback_df = pd.read_csv(FEEDBACK_FILE)
            if not feedback_df.empty and 'feedback_type' in feedback_df.columns:
                rejected_df = feedback_df[feedback_df['feedback_type'] == 'rejected']
                for _, row in rejected_df.iterrows():
                    outfit_tuple = tuple(row[field] for field in OUTFIT_FIELDS)
                    rejection_set.add(outfit_tuple)
                print(f"Loaded {len(rejection_set)} rejected outfits for filtering.")
        except Exception as e:
            print(f"[WARNING] Could not load feedback file: {e}")
    
    if rule_data.empty or gender is None:
        return []

    gender_specific_data = rule_data[rule_data['gender'].str.lower().str.strip().str.contains(gender, na=False)].copy()
    
    if gender_specific_data.empty:
        print(f"CRITICAL: No data found for gender '{gender}'. Cannot proceed.")
        return []

    try:
        match = re.search(r'(-?\d+(\.\d+)?)', str(current_temp))
        temp = float(match.group(0)) if match else 25
        temp = max(0, min(45, temp))
        if 0 <= temp <= 10: weather_range = "0-10"
        elif 11 <= temp <= 20: weather_range = "10-20"
        elif 21 <= temp <= 30: weather_range = "20-30"
        elif 31 <= temp <= 40: weather_range = "30-40"
        else: weather_range = "41+"
    except Exception as e:
        print(f"Warning: Temperature parsing failed: {str(e)}, defaulting to 20-30 range")
        weather_range = "20-30"

    print(f"\n--- Generating for: Gender='{gender}', Event='{event}', Outfit='{outfit}', Time='{time_of_day}', Weather='{weather_range}' ---")

    def generate_outfits_from_rows(df):
        all_outfits = []
        for _, row in df.iterrows():
            items = [
                split_and_strip(row.get('dress_type')) or ['N/A'],
                split_and_strip(row.get('dress_color')) or ['N/A'],
                split_and_strip(row.get('dress_fabric_texture')) or ['N/A'],
                split_and_strip(row.get('shoes_type')) or ['N/A'],
                split_and_strip(row.get('shoes_color')) or ['N/A'],
                split_and_strip(row.get('upper_layer')) or ['N/A'],
                split_and_strip(row.get('upper_layer_color')) or ['N/A']
            ]
            all_outfits.extend(list(product(*items)))
        return list(set(all_outfits))

    strict_rules = gender_specific_data[
        (gender_specific_data['weather_range'].astype(str).str.contains(weather_range, na=False)) &
        (gender_specific_data['event_name'].str.contains(event, na=False, case=False)) &
        (gender_specific_data['outfittype'].str.contains(outfit, na=False, case=False)) &
        (gender_specific_data['time'].str.contains(time_of_day, na=False, case=False))
    ].copy()
    recommendations = max_distinct_outfits(generate_outfits_from_rows(strict_rules))

    if len(recommendations) < 3:
        dress_pool_df = gender_specific_data[(gender_specific_data['event_name'].str.contains(event, na=False, case=False)) & (gender_specific_data['gender'].str.lower().str.strip() == gender)]
        weather_pool_df = gender_specific_data[(gender_specific_data['weather_range'].astype(str).str.contains(weather_range, na=False)) & (gender_specific_data['gender'].str.lower().str.strip() == gender)]
        item_pools = {
            'dress_type': list(set(item for _, row in dress_pool_df.iterrows() for item in split_and_strip(row.get('dress_type')))) or ['N/A'],
            'dress_color': list(set(item for _, row in dress_pool_df.iterrows() for item in split_and_strip(row.get('dress_color')))) or ['N/A'],
            'fabric': list(set(item for _, row in dress_pool_df.iterrows() for item in split_and_strip(row.get('dress_fabric_texture')))) or ['N/A'],
            'shoes_type': list(set(item for _, row in weather_pool_df.iterrows() for item in split_and_strip(row.get('shoes_type')))) or ['N/A'],
            'shoes_color': list(set(item for _, row in weather_pool_df.iterrows() for item in split_and_strip(row.get('shoes_color')))) or ['N/A'],
            'upper_layer': list(set(item for _, row in weather_pool_df.iterrows() for item in split_and_strip(row.get('upper_layer')))) or ['N/A'],
            'upper_color': list(set(item for _, row in weather_pool_df.iterrows() for item in split_and_strip(row.get('upper_layer_color')))) or ['N/A']
        }
        recommendations = find_diverse_outfits(item_pools, recommendations, 3 - len(recommendations), rejection_set)

    if len(recommendations) < 3:
        fallback_data = gender_specific_data[gender_specific_data['gender'].str.lower().str.strip() == gender]
        fallback_outfits = generate_outfits_from_rows(fallback_data)
        recommendations = max_distinct_outfits(fallback_outfits, max_outfits=3, existing_outfits=recommendations)

    def find_image_for_item(item_type, item_value):
        uploads_dir = os.path.join(os.getcwd(), 'uploads')
        if not os.path.exists(uploads_dir): return None
        for fname in os.listdir(uploads_dir):
            if fname.lower().endswith(('.jpg', '.jpeg', '.png')) and item_value and item_value.lower() in fname.lower():
                return f'/uploads/{fname}'
        return None

    final_recommendations = []
    for item in recommendations:
        rec = {
            "Dress Type": item[0],
            "Dress Color": item[1],
            "Dress Fabric/Texture": item[2],
            "Shoes Type": item[3],
            "Shoes Color": item[4],
            "Upper Layer": item[5],
            "Upper Layer Color": item[6],
        }
        rec["Dress Type Image"] = find_image_for_item("dress_type", item[0])
        rec["Shoes Type Image"] = find_image_for_item("shoes_type", item[3])
        final_recommendations.append(rec)
    return final_recommendations

# --- Image Processing and Avatar Endpoints (from original app.py) ---
def process_image(image_path, crop_coords=None, avatar_size=(512, 512)):
    """Process the image: remove background and apply cartoon effect."""
    try:
        with open(image_path, "rb") as img_file:
            input_image = img_file.read()
        removed_bg = remove(input_image)
        image_no_bg = Image.open(BytesIO(removed_bg)).convert("RGBA")

        if crop_coords:
            x, y, w, h = crop_coords
            image_no_bg = image_no_bg.crop((x, y, x + w, y + h))

        image_rgba = np.array(image_no_bg)
        image_rgb = cv2.cvtColor(image_rgba[:, :, :3], cv2.COLOR_RGBA2RGB)

        gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
        edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)
        edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
        cartoon = cv2.bitwise_and(image_rgb, edges_colored)

        alpha_channel = image_rgba[:, :, 3]
        cartoon_rgba = np.dstack((cartoon, alpha_channel))

        final_avatar = Image.fromarray(cartoon_rgba, mode="RGBA").resize(avatar_size, Image.Resampling.LANCZOS)

        buffer = BytesIO()
        final_avatar.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"❌ Processing Error: {e}")
        return None

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/cartoonify', methods=['GET', 'POST'])
def upload_image():
    if 'image' not in request.files and 'image' not in request.form:
        return jsonify({"error": "No image part"}), 400

    if 'image' in request.files:
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
    else: # Base64 image from web
        data = request.form['image']
        if data.startswith('data:image'):
            header, data = data.split(',', 1)
        try:
            image_data = base64.b64decode(data)
            image = Image.open(BytesIO(image_data))
            filename = 'web_upload.png'
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            image.save(filepath)
        except Exception as e:
            return jsonify({"error": f"Invalid image data: {e}"}), 400

    base64_cartoon = process_image(filepath)
    if not base64_cartoon:
        return jsonify({"error": "Failed to process image"}), 500
    
    return jsonify({"cartoonImage": f"data:image/png;base64,{base64_cartoon}"})

# --- Recommendation and Feedback Endpoints (from api.py) ---
@app.route('/recommend', methods=['POST'])
def recommend():
    """Generate outfit recommendations."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input"}), 400
    
    try:
        recommendations = get_recommendations(
            current_temp=data.get('weather', '25'),
            gender=data.get('gender'),
            event=data.get('event'),
            outfit=data.get('outfit'),
            time_of_day=data.get('time')
        )
        if not recommendations:
            return jsonify({"error": "No recommendations found for the given criteria."}), 404
        
        return jsonify(recommendations)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@app.route('/feedback', methods=['POST'])
def handle_feedback():
    data = request.get_json()
    outfit = data.get('outfit')
    feedback = data.get('feedback')

    if not outfit or not feedback:
        return jsonify({"error": "Missing outfit or feedback"}), 400

    try:
        if not os.path.exists(FEEDBACK_FILE):
            with open(FEEDBACK_FILE, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(OUTFIT_FIELDS + ['feedback_type'])

        with open(FEEDBACK_FILE, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            row = [outfit.get(field, 'N/A') for field in OUTFIT_FIELDS]
            row.append(feedback)
            writer.writerow(row)
        return jsonify({"status": "success", "message": "Feedback received"}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Could not process feedback"}), 500

# --- Main Execution Block ---
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

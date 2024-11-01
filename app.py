from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app, resources={
    r"/manhua": {"origins": ["http://localhost:6969", "https://booksverse.vercel.app"]},
    r"/manhwa": {"origins": ["http://localhost:6969", "https://booksverse.vercel.app"]}
})

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

API_KEY = os.environ.get('API_KEY')

def load_json(file_path):
    if not os.path.exists(file_path):
        return []
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def check_api_key():
    api_key = request.args.get('apikey')
    if api_key != API_KEY:
        return jsonify({"error": "Invalid API key"}), 403
    return None

@app.route('/manhua', methods=['GET', 'POST', 'DELETE', 'PUT'])
def manage_manhua():
    api_key_error = check_api_key()
    if api_key_error:
        return api_key_error

    if request.method == 'POST':
        new_manhua = request.json  
        data = load_json('manhua-komikindo.json')  
        data.append(new_manhua)
        save_json('manhua-komikindo.json', data)
        return jsonify(new_manhua), 201

    elif request.method == 'DELETE':
        title_to_delete = request.json.get('title')
        data = load_json('manhua-komikindo.json')
        updated_data = [manhua for manhua in data if manhua['title'] != title_to_delete]

        if len(data) == len(updated_data):
            return jsonify({"error": "Title not found"}), 404
        else:
            save_json('manhua-komikindo.json', updated_data)
            return jsonify({"message": "Manhua deleted successfully"}), 200

    elif request.method == 'PUT':
        updated_manhua = request.json
        data = load_json('manhua-komikindo.json')
        
        for index, manhua in enumerate(data):
            if manhua['title'] == updated_manhua['title']:
                data[index] = updated_manhua
                save_json('manhua-komikindo.json', data)
                return jsonify(updated_manhua), 200

        return jsonify({"error": "Manhua not found"}), 404

    data = load_json('manhua-komikindo.json')
    response = make_response(jsonify(data))
    response.headers['Cache-Control'] = 'no-store'
    return response

@app.route('/manhwa', methods=['GET', 'POST', 'DELETE', 'PUT'])
def manage_manhwa():
    api_key_error = check_api_key()
    if api_key_error:
        return api_key_error

    try:
        if request.method == 'POST':
            new_manhwa = request.json
            data = load_json('manhwa-komikindo.json')
            data.append(new_manhwa)
            save_json('manhwa-komikindo.json', data)
            return jsonify(new_manhwa), 201

        elif request.method == 'DELETE':
            titles_to_delete = request.json.get('titles', [])
            data = load_json('manhwa-komikindo.json')

            updated_data = [manhwa for manhwa in data if manhwa['title'] not in titles_to_delete]

            if len(data) == len(updated_data):
                return jsonify({"error": "None of the specified titles were found"}), 404
            else:
                save_json('manhwa-komikindo.json', updated_data)
                return jsonify({"message": "Selected Manhwa deleted successfully"}), 200

        elif request.method == 'PUT':
            updated_manhwa = request.json
            data = load_json('manhwa-komikindo.json')

            for index, manhwa in enumerate(data):
                if manhwa['title'] == updated_manhwa['title']:
                    data[index] = updated_manhwa
                    save_json('manhwa-komikindo.json', data)
                    return jsonify(updated_manhwa), 200

            return jsonify({"error": "Manhwa not found"}), 404

        data = load_json('manhwa-komikindo.json')
        response = make_response(jsonify(data))
        response.headers['Cache-Control'] = 'no-store'
        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

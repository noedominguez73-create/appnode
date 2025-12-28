import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=api_key)


print(f"Checking available models for key ending in ...{api_key[-4:]}...\n")

with open('models_list_utf8.txt', 'w', encoding='utf-8') as f:
    try:
        for m in genai.list_models():
            line = f"Model: {m.name}\n   - Methods: {m.supported_generation_methods}\n"
            f.write(line)
            if 'image' in m.name.lower() or 'vision' in m.name.lower():
                 f.write(f"   - [POTENTIAL IMAGE MODEL]\n")
            f.write("-" * 20 + "\n")
            print(line.strip()) # Also print to console
    except Exception as e:
        error_msg = f"Error listing models: {e}"
        print(error_msg)
        f.write(error_msg)

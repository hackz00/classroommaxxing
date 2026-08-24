from pathlib import Path
import os

name = "<NAME>" # <-- EDIT THIS: your npm package name

if name == "<NAME>" or not name.strip():
    print("ERROR: open RUN.py and set 'name' to your package name first!")
    print("Example: name = \"classroommaxxing-v6\"")
    os.system("pause")
    exit(1)

current_dir = Path('.')
for file_path in current_dir.iterdir():
    if file_path.is_file():
        try:
            if file_path.name != "RUN.py":
                content = file_path.read_text(encoding='utf-8')
                if "<NAME>" in content:
                    new_content = content.replace("<NAME>", name)
                    file_path.write_text(new_content, encoding='utf-8')
                    print(f"Updated: {file_path.name}")
        except Exception as e:
            print(f"Error processing {file_path.name}: {e}")

print("done - now run: npm publish")
os.remove("RUN.py")

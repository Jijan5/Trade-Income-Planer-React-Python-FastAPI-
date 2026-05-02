import os
import re

src_dir = r"c:\React-Project\trade-income-planer\src"

exclusions = ["LandingPage.jsx", "Auth.jsx", "ForgotPassword.jsx", "AdminDashboard.jsx", "CustomizePlatform.jsx", "index.css", "tailwind.config.js"]

replacements = {
    r"bg-\[\#0a0f1c\]": "bg-engine-panel",
    r"bg-\[\#030308\]": "bg-engine-bg",
    r"text-\[\#00cfff\]": "text-engine-neon",
    r"border-\[\#00cfff\]": "border-engine-neon",
    r"bg-\[\#00cfff\]": "bg-engine-button",
    r"from-\[\#00cfff\]": "from-engine-neon",
    r"to-\[\#00cfff\]": "to-engine-neon",
    r"text-\[\#030308\]": "text-engine-bg"
}

def process_file(filepath):
    filename = os.path.basename(filepath)
    if filename in exclusions:
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content
    for pattern, repl in replacements.items():
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filename}")

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".jsx", ".tsx", ".js")):
            process_file(os.path.join(root, file))

print("Done")

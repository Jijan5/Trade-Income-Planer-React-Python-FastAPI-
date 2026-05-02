import os
import re

src_dir = r"c:\React-Project\trade-income-planer\src"

exclusions = ["LandingPage.jsx", "Auth.jsx", "ForgotPassword.jsx", "AdminDashboard.jsx", "CustomizePlatform.jsx", "index.css", "tailwind.config.js"]

replacements = {
    r"bg-\[\#111827\]": "bg-engine-panel",
    r"bg-\[\#1e293b\]": "bg-engine-panel/80",
    r"bg-\[\#0f172a\]": "bg-engine-panel/50",
    r"border-gray-800": "border-engine-neon/20",
    r"border-gray-700": "border-engine-neon/30",
    r"accent-\[\#00cfff\]": "accent-engine-neon",
    r"stroke=\"\#00cfff\"": 'stroke="var(--engine-neon)"',
    r"stopColor=\"\#00cfff\"": 'stopColor="var(--engine-neon)"',
    r"stroke:\s*'\#00cfff'": "stroke: 'var(--engine-neon)'",
    r"rgba\(0,207,255": "rgba(var(--engine-neon-rgb)",
    r"shadow-\[0_0_8px_\#00cfff\]": "shadow-[0_0_8px_var(--engine-neon)]",
    r"shadow-\[0_0_5px_\#00cfff\]": "shadow-[0_0_5px_var(--engine-neon)]",
    r"text-\[\#00cfff\]": "text-engine-neon",
    r"bg-\[\#00cfff\]": "bg-engine-button",
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

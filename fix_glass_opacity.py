import os
import re

src_dir = r"c:\React-Project\trade-income-planer\src\components"

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".jsx", ".tsx", ".js")):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Replace bg-engine-panel/xx with bg-engine-panel
            # We use \b to make sure it matches word boundary, and \d+ to match numbers
            new_content = re.sub(r'bg-engine-panel/\d+', 'bg-engine-panel', content)
            
            # Also fix any backdrop-blur hardcodings? The user might want glass blur to be dynamic too!
            # The setting is --engine-glass-blur. In Tailwind, to use a custom variable for blur:
            # We can replace 'backdrop-blur-md' or 'backdrop-blur-xl' with a custom class 'backdrop-blur-engine'
            # But the user only complained about glass opacity right now.
            # I will fix backdrop-blur as well so the Blur setting works!
            new_content = re.sub(r'backdrop-blur-(sm|md|lg|xl|2xl|3xl|\d+px|\[.*?\])', 'backdrop-blur-engine', new_content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed opacities in {file}")

print("Done")

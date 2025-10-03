---
description: View and analyze screenshots with custom instructions
args:
  screenshot_names:
    description: Name(s) of screenshot file(s) - comma-separated for multiple (without extension)
    required: true
  instruction:
    description: What you want Claude to do with the screenshot(s)
    required: true
---

Please read and analyze the following screenshot(s):

{{screenshot_names}}

Task: {{instruction}}

After viewing the screenshot(s), provide your analysis or complete the requested task based on what you see in the image(s).

---

IMPORTANT: Read each screenshot from: `C:\Users\ACER\Documents\PROJECT A\gmh-case-study\references\screenshots\{name}.png`
If multiple screenshots are provided (comma-separated), read all of them before providing your analysis.

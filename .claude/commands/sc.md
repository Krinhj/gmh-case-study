---
description: View and analyze a screenshot with custom instructions
args:
  screenshot_name:
    description: Name of the screenshot file (without extension)
    required: true
  instruction:
    description: What you want Claude to do with the screenshot
    required: true
---

Please read and analyze the screenshot located at:
`C:\Users\ACER\Documents\PROJECT A\gmh-case-study\references\screenshots\{{screenshot_name}}.png`

Task: {{instruction}}

After viewing the screenshot, provide your analysis or complete the requested task based on what you see in the image.

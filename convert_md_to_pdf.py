import markdown
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
import re

# Read the Markdown file
with open('Interview_Prep_Guide.md', 'r') as f:
    md_content = f.read()

# Convert Markdown to HTML
html_content = markdown.markdown(md_content)

# Clean HTML to plain text (rough)
def html_to_text(html):
    # Remove tags
    text = re.sub(r'<[^>]+>', '', html)
    # Decode entities
    import html
    text = html.unescape(text)
    return text

plain_text = html_to_text(html_content)

# Create PDF
doc = SimpleDocTemplate('/Users/jboud1217/Desktop/Interview_Prep_Guide.pdf', pagesize=letter)
styles = getSampleStyleSheet()
story = []

# Split into paragraphs
paragraphs = plain_text.split('\n\n')
for para in paragraphs:
    if para.strip():
        p = Paragraph(para.strip(), styles['Normal'])
        story.append(p)
        story.append(Spacer(1, 12))

doc.build(story)
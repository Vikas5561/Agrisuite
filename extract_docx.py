import zipfile
import xml.etree.ElementTree as ET

docx_path = r'C:\Users\vikas\SoftEdgeX\SoftEdgeX AgriSuite.docx'
out_path = r'C:\Users\vikas\.gemini\antigravity\scratch\agrisuite\srs_extracted.txt'

try:
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        # docx namespaces
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        text_runs = []
        for p in root.findall('.//w:p', ns):
            p_text = []
            for r in p.findall('.//w:t', ns):
                if r.text:
                    p_text.append(r.text)
            text_runs.append(''.join(p_text))
            
        full_text = '\n'.join(text_runs)
        
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(full_text)
            
        print("Success! Extracted text length:", len(full_text))
except Exception as e:
    print("Error:", e)

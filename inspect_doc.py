import docx
import os

doc = docx.Document(r'd:\impactid-volunteer-platform\docs\ImpactID Project Report Draft.docx')

print('Total paragraphs:', len(doc.paragraphs))
for i, p in enumerate(doc.paragraphs):
    blips = p._element.xpath('.//a:blip')
    if blips:
        print(f'Paragraph {i}: blips={len(blips)}, text="{p.text}"')

print('Total tables:', len(doc.tables))
for t_idx, table in enumerate(doc.tables):
    for r_idx, row in enumerate(table.rows):
        for c_idx, cell in enumerate(row.cells):
            blips = cell._element.xpath('.//a:blip')
            if blips:
                print(f'Table {t_idx} [{r_idx},{c_idx}]: blips={len(blips)}, text="{cell.text.strip()[:60]}"')

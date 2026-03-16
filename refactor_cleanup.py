#!/usr/bin/env python3
import re

with open('public/system-refactor.html', 'r') as f:
    content = f.read()

lines = content.split('\n')

# === Step 1: Rename tab button ===
for i, line in enumerate(lines):
    if "showPanel('cleanup')" in line and '刪除清單' in line:
        lines[i] = line.replace('trash-2', 'clipboard-check').replace('刪除清單', '腳本檢查清單')
    if '<!-- TAB 4: 刪除清單 -->' in line:
        lines[i] = line.replace('刪除清單', '腳本檢查清單')

# === Step 2: Extract data from existing tables ===
content = '\n'.join(lines)

# Extract from the 591-script table: scripts with data-sugg
script_rows = re.findall(
    r'<tr data-name="([^"]*)"[^>]*data-cat="([^"]*)"[^>]*data-sugg="([^"]*)"[^>]*>(.*?)</tr>',
    content, re.DOTALL
)

keep_scripts = []  # Cron active / important
delete_scripts_from_main = []
archive_scripts = []

for name, cat, sugg, row_content in script_rows:
    tds = re.findall(r'<td[^>]*>(.*?)</td>', row_content, re.DOTALL)
    desc = re.sub(r'<[^>]+>', '', tds[3]).strip() if len(tds) > 3 else ''
    if sugg == '刪除':
        delete_scripts_from_main.append((name, cat, desc))
    elif sugg == '封存':
        archive_scripts.append((name, cat, desc))

# Extract from 確認刪除名單 (430 scripts)
delete_section_start = content.find('確認刪除名單（430 個）')
if delete_section_start != -1:
    delete_section = content[delete_section_start:delete_section_start + 200000]
    tbody_end = delete_section.find('</tbody>')
    delete_section = delete_section[:tbody_end] if tbody_end != -1 else delete_section

# Extract from overlap tab (TAB 7)
overlap_start = content.find('id="panel-overlap"')
merge_pairs = []
if overlap_start != -1:
    overlap_section = content[overlap_start:overlap_start + 20000]
    # Find ✅ 保留 / 🗑️ 刪除 pairs
    pairs = re.findall(
        r'✅ 保留\s*<code[^>]*>([^<]+)</code>[^🗑]*?🗑️ 刪除\s*<code[^>]*>([^<]+)</code>',
        overlap_section, re.DOTALL
    )
    for keep, delete in pairs:
        merge_pairs.append((keep.strip(), delete.strip()))
    
    # Also find additional delete targets
    all_deletes = re.findall(r'🗑️ 刪除\s*<code[^>]*>([^<]+)</code>', overlap_section)
    all_keeps = re.findall(r'✅ 保留\s*<code[^>]*>([^<]+)</code>', overlap_section)

# Get description from overlap for merge keeps
merge_keep_descs = re.findall(
    r'✅ 保留\s*<code[^>]*>([^<]+)</code>\s*—\s*([^<\n]+)',
    content[overlap_start:overlap_start+20000] if overlap_start != -1 else ''
)
merge_desc_map = {name.strip(): desc.strip() for name, desc in merge_keep_descs}

# For "保留腳本", we need the scripts that are in the "確認刪除名單" but marked as rescued
# Look for scripts with "審核救回" or "—" as ID (meaning they were rescued)
# Also, the overlap tab "保留" scripts
keep_from_overlap = list(set(all_keeps)) if overlap_start != -1 else []

# Since the 591 table doesn't explicitly mark "keep", we'll use:
# - Scripts from overlap tab marked ✅ 保留 (these are the confirmed keeps)
# - Scripts at end of delete table with "審核救回" label
keep_scripts_final = []
seen = set()
for name in keep_from_overlap:
    if name not in seen:
        desc = merge_desc_map.get(name, '')
        keep_scripts_final.append((name, '', desc))
        seen.add(name)

# Also get rescued scripts from the delete table
rescued_section = content[content.find('審核救回'):] if '審核救回' in content else ''
if rescued_section:
    rescued_start = content.find('審核救回') - 2000
    rescued_names = re.findall(
        r'font-family:monospace[^>]*>([^<]+)</td>\s*<td[^>]*>([^<]*審核救回[^<]*)</td>',
        content[rescued_start:rescued_start + 5000]
    )
    for name, desc in rescued_names:
        if name.strip() not in seen:
            keep_scripts_final.append((name.strip(), '', desc.strip()))
            seen.add(name.strip())

# Also extract the scripts with 手動/被呼叫 frequency in the delete table (these are actually keeps)
rescue_section = content[delete_section_start:delete_section_start + 200000] if delete_section_start != -1 else ''
manual_scripts = re.findall(
    r'font-family:monospace[^>]*>([^<]+)</td>\s*<td[^>]*>([^<]+)</td>\s*<td[^>]*>[^<]*(?:手動|被呼叫)[^<]*</td>',
    rescue_section
)
for name, desc in manual_scripts:
    if name.strip() not in seen:
        keep_scripts_final.append((name.strip(), '', desc.strip()))
        seen.add(name.strip())

# For delete table, get ALL scripts from 確認刪除名單 that have actual numbered IDs
delete_scripts_final = []
if delete_section_start != -1:
    delete_rows = re.findall(
        r'<td[^>]*>(\d+)</td>\s*<td[^>]*font-family:monospace[^>]*>([^<]+)</td>\s*<td[^>]*>([^<]*)</td>\s*<td[^>]*>([^<]*)</td>',
        rescue_section
    )
    for num, name, desc, freq in delete_rows:
        delete_scripts_final.append((name.strip(), num, desc.strip()))

# If we didn't get enough from the numbered rows, also get non-numbered ones that aren't rescued
if not delete_scripts_final:
    # Fallback: use the 12 from data-sugg="刪除" 
    delete_scripts_final = [(n, '', d) for n, c, d in delete_scripts_from_main]

print(f"保留: {len(keep_scripts_final)}, 合併: {len(merge_pairs)}, 刪除: {len(delete_scripts_final)}, 封存: {len(archive_scripts)}")

# === Step 3: Build new panel content ===

def row(i, name, extra, desc):
    return f'''      <tr style="border-bottom:1px solid #1e293b">
        <td style="padding:8px;text-align:center;color:#64748b;font-size:12px">{i}</td>
        <td style="padding:8px;font-family:monospace;font-size:12px;color:#e2e8f0">{name}</td>
        <td style="padding:8px;font-size:12px;color:#e2e8f0">{desc}</td>
      </tr>'''

def section(title, icon, color, scripts, note, cols=None):
    if cols is None:
        cols = ['#', '腳本名稱', '說明']
    
    header = ''.join(f'<th style="padding:10px 8px;text-align:left;color:#94a3b8;font-size:12px">{c}</th>' for c in cols)
    header = header.replace('text-align:left', 'text-align:center', 1)  # # column centered
    
    rows = '\n'.join(row(i+1, s[0], s[1], s[2] if len(s) > 2 else '') for i, s in enumerate(scripts))
    
    return f'''
  <div class="diagram-card" style="margin-bottom:24px;border-color:{color}">
    <div class="diagram-header" style="border-bottom-color:{color}">
      <div class="diagram-num" style="background:{color}">{icon}</div>
      <div>
        <h3>{title}（{len(scripts)} 個）</h3>
        <p>{note}</p>
      </div>
    </div>
    <div class="diagram-body" style="padding:0;overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#1e293b">
        <thead>
          <tr style="background:#0f172a;border-bottom:2px solid #334155">
            {header}
          </tr>
        </thead>
        <tbody>
{rows}
        </tbody>
      </table>
    </div>
  </div>'''

def merge_section(pairs):
    rows = ''
    for i, (keep, delete) in enumerate(pairs):
        rows += f'''      <tr style="border-bottom:1px solid #1e293b">
        <td style="padding:8px;text-align:center;color:#64748b;font-size:12px">{i+1}</td>
        <td style="padding:8px;font-family:monospace;font-size:12px;color:#4ade80">✅ {keep}</td>
        <td style="padding:8px;font-family:monospace;font-size:12px;color:#f87171">🗑️ {delete}</td>
      </tr>\n'''
    
    return f'''
  <div class="diagram-card" style="margin-bottom:24px;border-color:#f59e0b">
    <div class="diagram-header" style="border-bottom-color:#f59e0b">
      <div class="diagram-num" style="background:#f59e0b">🔄</div>
      <div>
        <h3>合併腳本（{len(pairs)} 組）</h3>
        <p>功能重疊的腳本對：保留主要版本，刪除被取代版本。</p>
      </div>
    </div>
    <div class="diagram-body" style="padding:0;overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#1e293b">
        <thead>
          <tr style="background:#0f172a;border-bottom:2px solid #334155">
            <th style="padding:10px 8px;text-align:center;color:#94a3b8;font-size:12px">#</th>
            <th style="padding:10px 8px;text-align:left;color:#94a3b8;font-size:12px">✅ 保留版本</th>
            <th style="padding:10px 8px;text-align:left;color:#94a3b8;font-size:12px">🗑️ 被取代版本</th>
          </tr>
        </thead>
        <tbody>
{rows}        </tbody>
      </table>
    </div>
  </div>'''

new_panel_content = f'''<!-- TAB 4: 腳本檢查清單 -->
<div id="panel-cleanup" class="panel">
  <div class="hero" style="padding-bottom:16px">
    <h1>腳本檢查清單</h1>
    <p>系統腳本三分類：保留、合併、刪除。確認後由 Travis 執行。</p>
  </div>

  <!-- Score Cards -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#22c55e">{len(keep_scripts_final)}</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px">✅ 保留腳本</div>
    </div>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#f59e0b">{len(merge_pairs)}</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px">🔄 合併腳本</div>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#ef4444">{len(delete_scripts_final)}</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px">🗑️ 刪除腳本</div>
    </div>
  </div>
{section('保留腳本', '✅', '#22c55e', keep_scripts_final, 'Cron 活躍、系統核心、被其他腳本引用的重要腳本。')}
{merge_section(merge_pairs)}
{section('刪除腳本', '🗑️', '#ef4444', delete_scripts_final, '確認可安全刪除的腳本。標記 ⚠️ 的需先處理引用。')}

</div>
'''

# === Step 4: Replace the cleanup panel ===
# Find from TAB 4 comment to TAB 5 comment
tab4_marker = '<!-- TAB 4: 腳本檢查清單 -->'
tab5_marker = '<!-- TAB 5:'

tab4_pos = content.find(tab4_marker)
tab5_pos = content.find(tab5_marker)

if tab4_pos == -1:
    tab4_pos = content.find('<!-- TAB 4:')
if tab5_pos == -1:
    print("ERROR: Cannot find TAB 5 marker!")
    exit(1)

# Also need to remove the filter script between the table and delete list
# Find script blocks related to scriptSearch/scriptTable
new_content = content[:tab4_pos] + new_panel_content + '\n' + content[tab5_pos:]

# Remove any orphaned script blocks that reference scriptSearch/scriptTable
# These should have been removed with the panel, but check
orphan_script = re.search(
    r"<script>\s*\(function\(\)\{.*?getElementById\('scriptSearch'\).*?\}\)\(\);\s*</script>",
    new_content, re.DOTALL
)
if orphan_script:
    new_content = new_content[:orphan_script.start()] + new_content[orphan_script.end():]

# === Step 5: Remove script lists from overlap tab (TAB 7) ===
# Replace overlap tab script content with a redirect note
overlap_panel_start = new_content.find('id="panel-overlap"')
if overlap_panel_start != -1:
    # Find the hero section end and the h2 sections
    h2_start = new_content.find('\n\n  <h2', overlap_panel_start)
    if h2_start == -1:
        h2_start = new_content.find('<h2', overlap_panel_start)
    
    # Find end of overlap panel content (before closing scripts)
    # Look for the pattern at end of overlap
    panel_end_pattern = new_content.find('<script>\n</script>', overlap_panel_start)
    if panel_end_pattern == -1:
        panel_end_pattern = new_content.find('</div>\n\n<script>', overlap_panel_start)
    
    if h2_start != -1 and panel_end_pattern != -1:
        redirect_note = '''

  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
    <p style="color:#94a3b8;font-size:14px">📋 腳本重疊分析已整合至「<strong style="color:#e2e8f0">腳本檢查清單</strong>」tab 的合併腳本表。</p>
  </div>

'''
        new_content = new_content[:h2_start] + redirect_note + new_content[panel_end_pattern:]

# === Step 6: Check other tabs for script tables to remove ===
# TAB 1 (overview): just mentions "591個腳本" in text - keep as-is (descriptive)
# TAB 2 (current-arch): diagram cards about architecture - no script tables
# TAB 3 (new-arch): architecture diagrams - no script tables  
# TAB 5 (phases): text mentions of deletion - keep as-is (plan description)
# TAB 6 (models): model comparison - no script tables

with open('public/system-refactor.html', 'w') as f:
    f.write(new_content)

orig_lines = content.count('\n')
new_lines = new_content.count('\n')
print(f"Original: {orig_lines} lines, New: {new_lines} lines")
print(f"Removed ~{orig_lines - new_lines} lines")
print("Done!")

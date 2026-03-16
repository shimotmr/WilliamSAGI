#!/usr/bin/env python3
"""
Refactor system-refactor.html:
1. Rename 刪除清單 tab → 腳本檢查清單
2. Replace cleanup panel content with 3 tables: 保留腳本, 合併腳本, 刪除腳本
3. Remove script tables/lists from other tabs
"""
import re

with open('public/system-refactor.html', 'r') as f:
    lines = f.readlines()

html = ''.join(lines)

# === Step 1: Rename tab ===
html = html.replace(
    '<div class="tab" onclick="showPanel(\'cleanup\')"><i data-lucide="trash-2" class="icon"></i> 刪除清單</div>',
    '<div class="tab" onclick="showPanel(\'cleanup\')"><i data-lucide="clipboard-check" class="icon"></i> 腳本檢查清單</div>'
)
html = html.replace('<!-- TAB 4: 刪除清單 -->', '<!-- TAB 4: 腳本檢查清單 -->')

# === Step 2: Extract data from the 591-script table ===
# Parse rows with data-sugg attributes
import re

# Extract keep scripts (Cron active - look for rows with cron checkmark)
# Extract delete scripts (data-sugg="刪除")
# For merge scripts, use overlap tab data

# Find all table rows in the 591 table
script_rows = re.findall(r'<tr data-name="([^"]*)"[^>]*data-cat="([^"]*)"[^>]*data-sugg="([^"]*)"[^>]*>(.*?)</tr>', html, re.DOTALL)

keep_scripts = []
delete_scripts = []
archive_scripts = []  # 封存 → will be used as "合併" candidates

for name, cat, sugg, content in script_rows:
    # Extract description
    desc_match = re.search(r'<td[^>]*>(?:<[^>]*>)*([^<]+)(?:</[^>]*>)*</td>\s*<td[^>]*>(?:<[^>]*>)*\s*</td>\s*<td', content)
    # Simpler: get the 4th td (description)
    tds = re.findall(r'<td[^>]*>(.*?)</td>', content, re.DOTALL)
    desc = ''
    if len(tds) >= 4:
        desc = re.sub(r'<[^>]+>', '', tds[3]).strip()
    
    # Check if cron active (has a checkmark in cron column)
    has_cron = '✅' in content or ('cron' in content.lower() and '活躍' in content)
    
    if sugg == '刪除':
        delete_scripts.append((name, cat, desc))
    elif sugg == '封存':
        archive_scripts.append((name, cat, desc))
    elif has_cron:
        keep_scripts.append((name, cat, desc))

# Also check for cron active scripts that might not have data-sugg but have ✅ in cron column
# Let's re-scan more carefully
keep_scripts2 = []
for name, cat, sugg, content in script_rows:
    tds = re.findall(r'<td[^>]*>(.*?)</td>', content, re.DOTALL)
    desc = ''
    if len(tds) >= 4:
        desc = re.sub(r'<[^>]+>', '', tds[3]).strip()
    # Check 5th td for cron
    cron_active = False
    if len(tds) >= 5:
        cron_td = tds[4]
        if '✅' in cron_td or '🟢' in cron_td:
            cron_active = True
    if cron_active and sugg != '刪除':
        keep_scripts2.append((name, cat, desc))

# Use keep_scripts2 if it found more
if len(keep_scripts2) > len(keep_scripts):
    keep_scripts = keep_scripts2

# Extract merge info from overlap tab (TAB 7)
# The overlap tab has "完全覆蓋" and "部分重疊" sections with keep/delete pairs
overlap_start = html.find('id="panel-overlap"')
overlap_end = html.find('</div>\n\n<script>', overlap_start) if overlap_start != -1 else -1

merge_entries = []
if overlap_start != -1:
    overlap_section = html[overlap_start:overlap_start+10000]
    # Find keep/delete pairs
    pairs = re.findall(r'✅ 保留.*?<code[^>]*>([^<]+)</code>.*?🗑️ 刪除.*?<code[^>]*>([^<]+)</code>', overlap_section, re.DOTALL)
    for keep, delete in pairs:
        merge_entries.append((keep.strip(), delete.strip()))

print(f"Found: {len(keep_scripts)} keep, {len(delete_scripts)} delete, {len(archive_scripts)} archive, {len(merge_entries)} merge pairs")

# Also get the 確認刪除名單 data
delete_confirm_start = html.find('確認刪除名單')
if delete_confirm_start != -1:
    # Count rows in that table
    section = html[delete_confirm_start:delete_confirm_start+50000]
    confirm_rows = re.findall(r'<td[^>]*font-family:monospace[^>]*>([^<]+)</td>', section)
    print(f"確認刪除名單 has {len(confirm_rows)} scripts")

# === Build new panel content ===
def make_table_row(idx, name, cat, desc, color_bg, color_text):
    return f'''      <tr style="border-bottom:1px solid #1e293b">
        <td style="padding:8px;text-align:center;color:#64748b;font-size:12px">{idx}</td>
        <td style="padding:8px;font-family:monospace;font-size:12px;color:#e2e8f0">{name}</td>
        <td style="padding:8px;font-size:12px;color:#94a3b8">{cat}</td>
        <td style="padding:8px;font-size:12px;color:#e2e8f0">{desc}</td>
      </tr>'''

def make_section(title, icon, num_style, scripts, desc_text):
    rows = '\n'.join(make_table_row(i+1, s[0], s[1], s[2], '', '') for i, s in enumerate(scripts))
    return f'''
  <div class="diagram-card" style="margin-bottom:24px;border-color:{num_style}">
    <div class="diagram-header" style="border-bottom-color:{num_style}">
      <div class="diagram-num" style="background:{num_style}">{icon}</div>
      <div>
        <h3>{title}（{len(scripts)} 個）</h3>
        <p>{desc_text}</p>
      </div>
    </div>
    <div class="diagram-body" style="padding:0;overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#1e293b">
        <thead>
          <tr style="background:#0f172a;border-bottom:2px solid #334155">
            <th style="padding:10px 8px;text-align:center;color:#94a3b8;font-size:12px">#</th>
            <th style="padding:10px 8px;text-align:left;color:#94a3b8;font-size:12px">腳本名稱</th>
            <th style="padding:10px 8px;text-align:left;color:#94a3b8;font-size:12px">類別</th>
            <th style="padding:10px 8px;text-align:left;color:#94a3b8;font-size:12px">說明</th>
          </tr>
        </thead>
        <tbody>
{rows}
        </tbody>
      </table>
    </div>
  </div>'''

# Build merge table with different format
def make_merge_section(pairs):
    rows = ''
    for i, (keep, delete) in enumerate(pairs):
        rows += f'''      <tr style="border-bottom:1px solid #1e293b">
        <td style="padding:8px;text-align:center;color:#64748b;font-size:12px">{i+1}</td>
        <td style="padding:8px;font-family:monospace;font-size:12px;color:#4ade80">{keep}</td>
        <td style="padding:8px;font-family:monospace;font-size:12px;color:#f87171">{delete}</td>
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

# Get delete list from 確認刪除名單 (more comprehensive)
delete_from_confirm = []
if delete_confirm_start != -1:
    section = html[delete_confirm_start:delete_confirm_start+100000]
    # Parse rows: each has script name, reason, safety, action
    rows_match = re.findall(r'<tr>\s*<td[^>]*>(\d+)</td>\s*<td[^>]*font-family:monospace[^>]*>([^<]+)</td>\s*<td[^>]*>([^<]*)</td>', section)
    for num, name, reason in rows_match:
        delete_from_confirm.append((name.strip(), reason.strip()))

print(f"Delete from confirm list: {len(delete_from_confirm)}")

# Use confirm list for delete table if available
if delete_from_confirm:
    delete_for_table = [(name, '', reason) for name, reason in delete_from_confirm]
else:
    delete_for_table = delete_scripts

# Build new panel
new_panel = f'''<!-- TAB 4: 腳本檢查清單 -->
<div id="panel-cleanup" class="panel">
  <div class="hero" style="padding-bottom:16px">
    <h1>腳本檢查清單</h1>
    <p>系統腳本三分類：保留、合併、刪除。確認後由 Travis 執行。</p>
  </div>

  <!-- Score Cards -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#22c55e">{len(keep_scripts)}</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px">✅ 保留腳本</div>
    </div>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#f59e0b">{len(merge_entries)}</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px">🔄 合併腳本</div>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:28px;font-weight:700;color:#ef4444">{len(delete_for_table)}</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px">🗑️ 刪除腳本</div>
    </div>
  </div>
{make_section('保留腳本', '✅', '#22c55e', keep_scripts, 'Cron 活躍、系統核心腳本，確認保留。')}
{make_merge_section(merge_entries)}
{make_section('刪除腳本', '🗑️', '#ef4444', delete_for_table, '確認刪除的腳本。標記 ⚠️ 的需先處理引用再刪。')}

</div>
'''

# === Step 3: Replace the cleanup panel ===
# Find panel start and end
panel_start_marker = '<!-- TAB 4: 腳本檢查清單 -->'  # already renamed
panel_start = html.find(panel_start_marker)
if panel_start == -1:
    # Try old name
    panel_start_marker = '<!-- TAB 4: 刪除清單 -->'
    panel_start = html.find(panel_start_marker)

# Find the next tab marker
next_tab = html.find('<!-- TAB 5:', panel_start)

# Replace everything between panel_start and next_tab
old_panel = html[panel_start:next_tab]
html = html[:panel_start] + new_panel + '\n' + html[next_tab:]

# === Step 4: Remove script tables from other tabs ===

# TAB 1 (overview, lines ~145-213): Has problem list with "23個dispatch腳本", "11個通知腳本" - these are just text mentions, keep them
# TAB 5 (phases): Has text mentions of "刪除 10 個重複通知腳本" - text references, keep
# TAB 6 (models): No script tables
# TAB 7 (overlap): Has 完全覆蓋/部分重疊/待確認 sections with script keep/delete pairs
#   → Remove these since they're now consolidated in 腳本檢查清單

# Remove overlap tab script content (keep the tab but remove script lists)
overlap_panel_start = html.find('id="panel-overlap"')
if overlap_panel_start != -1:
    # Find the panel div start
    panel_div_start = html.rfind('<div', 0, overlap_panel_start + 20)
    # Find the end - next closing script tag or next tab
    overlap_section_start = html.find('<h2', overlap_panel_start)
    
    # Find all three h2 sections and their content until end of panel
    # Remove from first h2 to end of panel (before closing </div>)
    last_script_in_overlap = html.find('<script>\n</script>\n<script>lucide.createIcons();</script>', overlap_panel_start)
    if last_script_in_overlap != -1:
        # Find the content between hero and the final scripts
        hero_end = html.find('</div>\n\n  <h2', overlap_panel_start)
        if hero_end != -1:
            hero_end = html.find('\n\n  <h2', overlap_panel_start)
            # Replace the three sections with a note
            section_start = hero_end
            section_end = last_script_in_overlap
            old_sections = html[section_start:section_end]
            new_sections = '''

  <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
    <p style="color:#94a3b8;font-size:14px">📋 腳本重疊分析已整合至「腳本檢查清單」tab，請切換查看完整的保留/合併/刪除清單。</p>
  </div>

'''
            html = html[:section_start] + new_sections + html[section_end:]

# Also remove the filter script that references scriptTable (which no longer exists)
# Find and remove the script block for the old 591 table filter
old_filter_script_start = html.find("const search = document.getElementById('scriptSearch')")
if old_filter_script_start != -1:
    script_tag_start = html.rfind('<script>', 0, old_filter_script_start)
    script_tag_end = html.find('</script>', old_filter_script_start) + len('</script>')
    html = html[:script_tag_start] + html[script_tag_end:]

# Write output
with open('public/system-refactor.html', 'w') as f:
    f.write(html)

print("Done! File written.")
print(f"Final stats: {len(keep_scripts)} keep, {len(merge_entries)} merge pairs, {len(delete_for_table)} delete")

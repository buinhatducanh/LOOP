# Translation Management Setup — Phrase / Lokalise PoC

> **Mục đích:** Hướng dẫn setup Phrase.com (recommended) để quản lý translation workflow cho LOOP website.
> **Trạng thái:** PoC — chưa triển khai production
> **Cập nhật:** 2026-03-27

---

## Tại sao cần translation management?

Hiện tại: file JSON thủ công trong `src/messages/`
Vấn đề:
- Không có review workflow (AI draft → human review)
- Không track được ai đã dịch / chưa dịch
- Conflict khi nhiều người edit cùng lúc
- Không có translation memory (dịch lại cùng một cụm)

---

## Option A — Phrase.com (Recommended)

### Ưu điểm
- GitHub/Vercel native integration
- Translation editor tốt nhất thị trường
- Auto-sync khi push git
- Translation memory giảm 30-50% effort
- CLI mạnh: `phrase push/pull`

### Setup steps

#### 1. Tạo project trên Phrase
```
https://app.phrase.com
→ New Project
→ Name: "LOOP Website"
→ Source locale: Vietnamese (vi)
→ Target locales: English (en), Japanese (ja), Korean (ko), Chinese Simplified (zh)
```

#### 2. Cài Phrase CLI
```bash
npm install -g phrase-cli
phrase login
```

#### 3. Tạo config file
```json
// .phrase.json (add to .gitignore after setup)
{
  "access_token": "YOUR_PERSONAL_ACCESS_TOKEN",
  "project": "loop-website",
  "file_format": "nested_json",
  "push": {
    "sources": [
      { "file": "./src/messages/vi.json", "params": { "locale_id": "vi" } }
    ]
  },
  "pull": {
    "targets": [
      { "file": "./src/messages/{locale}.json", "params": { "locale_id": "{locale_id}" } }
    ]
  }
}
```

#### 4. Push source file
```bash
# Chỉ push vi.json (source of truth)
phrase push

# Pull all translations về
phrase pull
```

#### 5. GitHub Action (auto-sync)
```yaml
# .github/workflows/translations.yml
name: Sync Translations

on:
  push:
    branches: [main]
    paths:
      - 'src/messages/vi.json'

jobs:
  sync-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g phrase-cli
      - run: phrase pull
        env:
          PHRASE_ACCESS_TOKEN: ${{ secrets.PHRASE_ACCESS_TOKEN }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: pull latest translations from Phrase"
          file_pattern: src/messages/*.json
```

### Chi phí
| Plan | Giá | Phù hợp |
|------|-----|---------|
| Starter | Miễn phí | < 1 project, < 1K strings |
| Growth | ~€25/tháng | 1-3 projects, translation memory |
| Business | ~€80/tháng | Team 5+ người, workflows |

---

## Option B — Lokalise

### Ưu điểm
- Tương tự Phrase
- AI translation tích hợp sẵn (DeepL/Google)
- Slack/Teams notification

### Setup tương tự
```bash
npm install -g lokalise-cli
lokalise login
lokalise setup --project-id YOUR_PROJECT_ID
```

---

## Recommendation cho LOOP

**Dùng Phrase.com với:**
- Free Starter plan (đủ cho < 1K strings hiện tại)
- GitHub Action auto-sync khi `vi.json` thay đổi
- Translation memory giúp dịch nhanh hơn

**Workflow mới:**
1. DEV thêm/sửa key trong `vi.json`
2. GitHub Action push lên Phrase
3. Translator/AI dịch trên Phrase dashboard
4. Reviewer approve
5. Phrase tự động PR vào repo hoặc sync qua CLI

---

## Interim: AI-assisted Translation (không cần tool)

Trong khi chờ setup Phrase/Lokalise, dùng Claude để assisted translation:

```bash
# Extract missing keys
cat src/messages/en.json | jq -r 'keys[]' > en_keys.txt
cat src/messages/ja.json | jq -r 'keys[]' > ja_keys.txt
diff en_keys.txt ja_keys.txt | grep '<' | sed 's/< //'
```

Sau đó copy diff output → prompt cho Claude:
> "Translate these EN strings to JA (Japanese). Keep JSON keys unchanged. Return only the JSON values."
```

---

## Translation QA Checklist

Trước khi merge translation PR:
- [ ] Số key match giữa vi và target locale
- [ ] Không có `null` hoặc `undefined` string value
- [ ] Placeholder `{name}` giữ nguyên trong tất cả locales
- [ ] HTML entities (`&amp;`, `&lt;`, `&gt;`) giữ nguyên
- [ ] Max 20% key để trống (còn lại fallback về VI)
- [ ] Locale switcher hoạt động đúng trên staging

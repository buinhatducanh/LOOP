import re
with open(r'D:/LOOP_COMPANY/LOOP/src/app/[locale]/khach-hang/page.tsx', 'r', encoding='utf-8') as f:
 content = f.read()

old = ' </div>\r\n </div>\r\n\r\n {/* Content */}\r\n <div style={{ paddingTop: 80'
new = ' </div>\r\n </div>\r\n\r\n {/* Payment result banner */}\r\n <PaymentResultBannerWrapper locale={locale} />\r\n\r\n {/* Content */}\r\n <div style={{ paddingTop: 80'

if old in content:
 content = content.replace(old, new, 1)
 with open(r'D:/LOOP_COMPANY/LOOP/src/app/[locale]/khach-hang/page.tsx', 'w', encoding='utf-8') as f:
 f.write(content)
 print('REPLACED OK')
else:
 print('NOT FOUND')

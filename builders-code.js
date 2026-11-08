/* 코드 빌더 (M5 doGet, 심화 자동화) */
(function(){
var R=GESB.register;
R('doget',{code:true,hint:'💡 시트 이름만 확인하면 됩니다. 완성된 코드를 Apps Script 편집기에 붙여넣으세요.',tpl:"\n      function doGet(e) {\n  // 첫 번째 시트(응답 시트)를 사용합니다. 빈 '시트1'이 앞에 있으면\n  // getSheetByName('설문지 응답 시트1') 로 바꿔주세요.\n  const sheet = {sexpr};\n  const data = sheet.getDataRange().getValues();\n  const headers = data[0];\n  const rows = data.slice(1);\n  const result = rows\n    .filter(row => row.join('').trim() !== '')\n    .map(row => {\n      let obj = {};\n      headers.forEach((header, index) => {\n        if (row[index] instanceof Date) {\n          obj[header] = row[index].toLocaleString('ko-KR', { timeZone: '{tz}' });\n        } else {\n          obj[header] = row[index];\n        }\n      });\n      return obj;\n    });\n  return ContentService.createTextOutput(JSON.stringify(result))\n    .setMimeType(ContentService.MimeType.JSON);\n}\n    ",groups:[
  {key:'sname',text:true,label:'응답 시트 이름 (비워 두면 첫 번째 시트 사용)',ph:'예: 설문지 응답 시트1',def:''},
  {key:'sexpr',calc:function(g){ var n=g('sname'); return n ? "SpreadsheetApp.getActiveSpreadsheet().getSheetByName('"+n.replace(/'/g,"\\'")+"')" : 'SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]'; }},
  {key:'tz',label:'시간대',opts:[['한국(서울)','Asia/Seoul',true]]}
]});
R('autocode',{code:true,hint:'💡 앞의 프롬프트로 코드를 받는 대신, 이 칸에 내 파일의 이름을 넣으면 코드가 바로 완성됩니다. 폼 질문 제목은 폼과 똑같이 적으세요.',tpl:"\n    // {title} 자동 발송 시스템\n// [사용 전 필수] 아래 두 값을 본인 것으로 교체\nconst TEMPLATE_ID = '{tid}';\nconst FOLDER_ID   = '{fid}';\n\nfunction onFormSubmit(e) {\n  // 1. 응모번호 생성 (동시 제출 안전)\n  const row      = e.range.getRow();\n  const entryNum = String(row - 1).padStart(3, '0');\n\n  // 2. 폼 응답 추출 (질문명이 폼과 정확히 일치해야 함)\n  const responses = e.namedValues;\n  const email     = responses['{qe}'][0].trim();\n  const name      = responses['{qn}'][0].trim();\n  const memory    = responses['{qm}'][0].trim();\n  const photoUrls = responses['{qp}'];\n\n  // 3. 슬라이드 템플릿 복사\n  const templateFile = DriveApp.getFileById(TEMPLATE_ID);\n  const outputFolder = DriveApp.getFolderById(FOLDER_ID);\n  const copiedFile   = templateFile.makeCopy(`{fname}_${name}_${entryNum}`, outputFolder);\n  const presentation = SlidesApp.openById(copiedFile.getId());\n  const slide        = presentation.getSlides()[0];\n\n  // 4. 텍스트 치환\n  presentation.replaceAllText('{mn}',    name);\n  presentation.replaceAllText('{mm}',    memory);\n  presentation.replaceAllText('{mc}', `#${entryNum}`);\n\n  // 5. 사진 치환 (대체 텍스트 '{alt}' 도형을 이미지로)\n  if (photoUrls && photoUrls[0] && photoUrls[0].trim() !== '') {\n    try {\n      const photoUrl     = photoUrls[0].trim();\n      const photoIdMatch = photoUrl.match(/id=([a-zA-Z0-9_-]+)/) ||\n                           photoUrl.match(/\\/d\\/([a-zA-Z0-9_-]+)/);\n      const photoBlob    = DriveApp.getFileById(photoIdMatch[1]).getBlob();\n      const elements     = slide.getPageElements();\n      for (const el of elements) {\n        if (el.getTitle() === '{alt}' || el.getDescription() === '{alt}') {\n          const type = el.getPageElementType();\n          if (type === SlidesApp.PageElementType.SHAPE)\n            el.asShape().replaceWithImage(photoBlob);\n          else if (type === SlidesApp.PageElementType.IMAGE)\n            el.asImage().replace(photoBlob, true);\n          break;\n        }\n      }\n    } catch (err) {\n      console.error('사진 로드 실패:', err.message);\n    }\n  }\n  presentation.saveAndClose();\n\n  // 6. PDF 변환 및 메일 발송\n  const pdfBlob = DriveApp.getFileById(copiedFile.getId())\n    .getAs('application/pdf')\n    .setName(`{fname}_${name}_${entryNum}.pdf`);\n\n  GmailApp.sendEmail(email,\n    `{subj} ${name}님의 응모번호: #${entryNum}`,\n    `${name}님, {greet}\\n\\n응모번호: #${entryNum}\\n\\n첨부파일을 확인해 주세요.`,\n    { attachments: [pdfBlob] }\n  );\n}\n  ",groups:[
  {key:'tid',text:true,label:'슬라이드 템플릿 ID',ph:'YOUR_TEMPLATE_SLIDE_ID',def:''},
  {key:'fid',text:true,label:'저장할 폴더 ID',ph:'YOUR_OUTPUT_FOLDER_ID',def:''},
  {key:'qe',text:true,label:'폼 질문 제목 · 이메일',ph:'이메일',def:'이메일'},
  {key:'qn',text:true,label:'폼 질문 제목 · 이름',ph:'이름',def:'이름'},
  {key:'qm',text:true,label:'폼 질문 제목 · 소감',ph:'소감',def:'소감'},
  {key:'qp',text:true,label:'폼 질문 제목 · 사진',ph:'사진',def:'사진'},
  {key:'mn',text:true,label:'슬라이드 표식 · 이름',ph:'{{이름}}',def:'{{이름}}'},
  {key:'mm',text:true,label:'슬라이드 표식 · 소감',ph:'{{소감}}',def:'{{소감}}'},
  {key:'mc',text:true,label:'슬라이드 표식 · 응모번호',ph:'{{응모번호}}',def:'{{응모번호}}'},
  {key:'alt',text:true,label:'사진 자리 대체 텍스트',ph:'사진자리',def:'사진자리'},
  {key:'title',label:'자동화 이름 (코드 맨 위 설명)',custom:true,cph:'예: 활동 소감 엽서',opts:[['활동 소감 엽서 + 응모번호','활동 소감 엽서 + 응모번호',true],['제출 확인증','제출 확인증'],['개별 안내 메일','개별 안내 메일']]},
  {key:'fname',text:true,label:'파일 이름 앞부분',ph:'엽서',def:'엽서'},
  {key:'subj',text:true,label:'메일 제목 앞부분',ph:'[활동 엽서]',def:'[활동 엽서]'},
  {key:'greet',text:true,label:'메일 인사 문장',ph:'엽서를 보내드립니다!',def:'엽서를 보내드립니다!'}
]});
})();

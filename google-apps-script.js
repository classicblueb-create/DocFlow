// =================================================================
// ModtyTasks: The Ultimate Backend API (รวมโค้ด DB ของคุณ + PDF)
// =================================================================

// 1. ระบุ ID ของสเปรดชีตที่ต้องการเชื่อมต่อ (แก้ไขตรงนี้ให้เป็น ID ของชีตคุณ)
const SPREADSHEET_ID = '14I_CP_xFs2h_Y3KRdII1RQJj-6LHsb2EySUjEaLA-hY';

// 2. ระบุ ID โฟลเดอร์ใน Google Drive ที่จะใช้เก็บไฟล์ PDF ใบเสนอราคา
const FOLDER_ID = '1hjs1p95trqkNak9j4ERRX7d0O9TXou56';

// 3. ระบุ ID โฟลเดอร์สำหรับไฟล์แนบของ Task (ถ้าว่างจะใช้ FOLDER_ID แทน)
const ATTACHMENTS_FOLDER_ID = '';

// ฟังก์ชันเปิดเชื่อมต่อกับ Google Sheet อย่างปลอดภัย (รองรับทั้ง standalone และ container-bound)
function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID) {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (e) {
    console.warn("ไม่สามารถเปิดสเปรดชีตจาก ID ได้ กำลังสลับไปใช้ Active Spreadsheet: " + e.toString());
  }
  
  const activeSS = SpreadsheetApp.getActiveSpreadsheet();
  if (!activeSS) {
    throw new Error("ไม่พบ Google Sheet! โปรดใส่ SPREADSHEET_ID ที่ถูกต้องที่ส่วนบนของสคริปต์");
  }
  return activeSS;
}

// ฟังก์ชันช่วยดึงหน้าชีต หรือสร้างหน้าชีตขึ้นมาใหม่พร้อมหัวตารางหากไม่มีชีตนั้นอยู่
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sheet;
}

// 1. ตอบกลับเมื่อหน้าเว็บส่ง HTTP GET เข้ามา (ดึงข้อมูลทั้งหมดไปแสดงผล)
function doGet(e) {
  try {
    const ss = getSpreadsheet();
    
    // ฟังก์ชันช่วยอ่านข้อมูลจาก Sheet เป็น JSON (ข้ามหัวตาราง)
    const getSheetData = (sheetName, headers) => {
      const sheet = getOrCreateSheet(ss, sheetName, headers);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return []; // ไม่มีข้อมูลนอกจากหัวตาราง
      
      const sheetHeaders = data[0];
      return data.slice(1).map(row => {
        let obj = {};
        sheetHeaders.forEach((h, i) => {
          if (h) obj[h] = row[i];
        });
        return obj;
      });
    };

    // กำหนดโครงสร้างคอลัมน์มาตรฐานเพื่อใช้สร้างหน้าชีตอัตโนมัติหากยังไม่มี
    const taskHeaders = ['id', 'name', 'status', 'price', 'devCost', 'myIncome', 'clientId', 'priority', 'startDate', 'endDate', 'tags', 'details', 'subtasks', 'aiAnalysis', 'aiEmail', 'aiCourse', 'aiChatHistory', 'dependencies', 'comments', 'attachments', 'customer', 'updatedAt'];
    const clientHeaders = ['id', 'name', 'color', 'contactName', 'contactTitle', 'email', 'phone', 'mobile', 'website', 'lineId', 'address', 'subDistrict', 'district', 'province', 'postalCode', 'country', 'taxId', 'companyRegNo', 'businessType', 'vatRegistered', 'targetBudget', 'currency', 'paymentTerms', 'creditLimit', 'industry', 'source', 'notes', 'createdAt'];
    const templateHeaders = ['id', 'name', 'price', 'details'];
    const ideaHeaders = ['id', 'title', 'description', 'category', 'tags', 'createdAt', 'aiAnalysis', 'priority', 'effort', 'status'];
    const settingHeaders = ['BusinessName', 'BusinessAddress'];

    // ส่งกลับข้อมูล 5 ตารางพร้อมกันให้หน้าเว็บ
    const responseData = {
      tasks: getSheetData('Tasks_DB', taskHeaders),
      clients: getSheetData('Clients_DB', clientHeaders),
      templates: getSheetData('Templates_DB', templateHeaders),
      ideas: getSheetData('Ideas_DB', ideaHeaders),
      settings: getSheetData('Settings_DB', settingHeaders)[0] || {}
    };

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. รับข้อมูลเมื่อมีการ แก้ไข/สร้าง/ลบ หรือสร้าง PDF จากหน้าเว็บ
function doPost(e) {
  try {
    if (!e) return jsonResponse({ status: 'error', message: 'No data received' });

    var rawData;
    if (e.parameter && e.parameter.data) {
      rawData = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      rawData = JSON.parse(e.postData.contents);
    } else {
      return jsonResponse({ status: 'error', message: 'Data format not recognized' });
    }

    var action = rawData.action; 
    var data = rawData.data || rawData; 
    
    var ss = getSpreadsheet();

    // ==========================================
    // โหมด 1: สร้าง PDF ใบเสนอราคา (DocFlow)
    // ==========================================
    if (action === 'generatePDF') {
      const pdfUrl = createInvoicePDF(data);
      return jsonResponse({ status: 'success', url: pdfUrl });
    }

    // ==========================================
    // โหมด 2: ตั้งค่าธุรกิจ
    // ==========================================
    if (action === 'saveSettings') {
      const settingHeaders = ['BusinessName', 'BusinessAddress'];
      const sheet = getOrCreateSheet(ss, 'Settings_DB', settingHeaders);
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, 1, 2).setValues([[data.BusinessName, data.BusinessAddress]]);
      } else {
        sheet.appendRow([data.BusinessName, data.BusinessAddress]);
      }
      return jsonResponse({ status: 'success' });
    }

    // ==========================================
    // โหมด 3: จัดการ Tasks
    // ==========================================
    if (action === 'saveTask' || action === 'save' || !action) {
      const taskHeaders = ['id', 'name', 'status', 'price', 'devCost', 'myIncome', 'clientId', 'priority', 'startDate', 'endDate', 'tags', 'details', 'subtasks', 'aiAnalysis', 'aiEmail', 'aiCourse', 'aiChatHistory', 'dependencies', 'comments', 'attachments', 'customer', 'updatedAt'];
      const sheet = getOrCreateSheet(ss, 'Tasks_DB', taskHeaders);
      const id = String(data.id);
      const rowIndex = findRowById(sheet, id);
      const rowData = [
        id,
        data.name || '-',
        data.status || 'To Do',
        data.price || '0',
        data.devCost || '0',
        data.myIncome || '0',
        data.clientId || '',
        data.priority || '',
        data.startDate || '-',
        data.endDate || '-',
        data.tags || '-',
        data.details || '-',
        data.subtasks || '[]',
        data.aiAnalysis || '',
        data.aiEmail || '',
        data.aiCourse || '',
        data.aiChatHistory || '',
        data.dependencies || '[]',
        data.comments || '[]',
        data.attachments || '[]',
        data.customer || '',
        new Date()
      ];
      if (rowIndex > -1) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return jsonResponse({ status: 'success', message: 'Task saved' });
    }

    if (action === 'deleteTask' || action === 'delete') {
      const taskHeaders = ['id', 'name', 'status', 'price', 'devCost', 'myIncome', 'clientId', 'priority', 'startDate', 'endDate', 'tags', 'details', 'subtasks', 'aiAnalysis', 'aiEmail', 'aiCourse', 'aiChatHistory', 'dependencies', 'comments', 'attachments', 'customer', 'updatedAt'];
      const sheet = getOrCreateSheet(ss, 'Tasks_DB', taskHeaders);
      const rowIndex = findRowById(sheet, String(data.id));
      if (rowIndex > -1) sheet.deleteRow(rowIndex);
      return jsonResponse({ status: 'success', message: 'Task deleted' });
    }

    // ==========================================
    // โหมด 4: จัดการ Clients
    // ==========================================
    if (action === 'saveClient') {
      const clientHeaders = ['id', 'name', 'color', 'contactName', 'contactTitle', 'email', 'phone', 'mobile', 'website', 'lineId', 'address', 'subDistrict', 'district', 'province', 'postalCode', 'country', 'taxId', 'companyRegNo', 'businessType', 'vatRegistered', 'targetBudget', 'currency', 'paymentTerms', 'creditLimit', 'industry', 'source', 'notes', 'createdAt'];
      const sheet = getOrCreateSheet(ss, 'Clients_DB', clientHeaders);
      const id = String(data.id);
      const rowIndex = findRowById(sheet, id);
      const rowData = [
        id, data.name || '-', data.color || 'blue',
        data.contactName || '', data.contactTitle || '',
        data.email || '', data.phone || '', data.mobile || '', data.website || '', data.lineId || '',
        data.address || '', data.subDistrict || '', data.district || '', data.province || '', data.postalCode || '', data.country || '',
        data.taxId || '', data.companyRegNo || '', data.businessType || '', data.vatRegistered || 'false',
        data.targetBudget || 0, data.currency || '', data.paymentTerms || '', data.creditLimit || '',
        data.industry || '', data.source || '', data.notes || '',
        data.createdAt || new Date().toISOString()
      ];
      if (rowIndex > -1) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return jsonResponse({ status: 'success', message: 'Client saved' });
    }

    if (action === 'deleteClient') {
      const sheet = getOrCreateSheet(ss, 'Clients_DB', ['id']);
      const rowIndex = findRowById(sheet, String(data.id));
      if (rowIndex > -1) sheet.deleteRow(rowIndex);
      return jsonResponse({ status: 'success', message: 'Client deleted' });
    }

    // ==========================================
    // โหมด 5: จัดการ Templates
    // ==========================================
    if (action === 'saveTemplate') {
      const templateHeaders = ['id', 'name', 'price', 'details'];
      const sheet = getOrCreateSheet(ss, 'Templates_DB', templateHeaders);
      const id = String(data.id);
      const rowIndex = findRowById(sheet, id);
      const rowData = [id, data.name || '-', data.price || 0, data.details || ''];
      if (rowIndex > -1) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return jsonResponse({ status: 'success', message: 'Template saved' });
    }

    if (action === 'deleteTemplate') {
      const templateHeaders = ['id', 'name', 'price', 'details'];
      const sheet = getOrCreateSheet(ss, 'Templates_DB', templateHeaders);
      const rowIndex = findRowById(sheet, String(data.id));
      if (rowIndex > -1) sheet.deleteRow(rowIndex);
      return jsonResponse({ status: 'success', message: 'Template deleted' });
    }

    // ==========================================
    // โหมด 6: จัดการ Ideas
    // ==========================================
    if (action === 'saveIdea') {
      const ideaHeaders = ['id', 'title', 'description', 'category', 'tags', 'createdAt', 'aiAnalysis', 'priority', 'effort', 'status'];
      const sheet = getOrCreateSheet(ss, 'Ideas_DB', ideaHeaders);
      const id = String(data.id);
      const rowIndex = findRowById(sheet, id);
      const rowData = [
        id,
        data.title || '-',
        data.description || '',
        data.category || '',
        data.tags || '',
        data.createdAt || new Date().toISOString(),
        data.aiAnalysis || '',
        data.priority || '',
        data.effort || '',
        data.status || 'ไอเดีย'
      ];
      if (rowIndex > -1) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return jsonResponse({ status: 'success', message: 'Idea saved' });
    }

    if (action === 'deleteIdea') {
      const ideaHeaders = ['id', 'title', 'description', 'category', 'tags', 'createdAt', 'aiAnalysis', 'priority', 'effort', 'status'];
      const sheet = getOrCreateSheet(ss, 'Ideas_DB', ideaHeaders);
      const rowIndex = findRowById(sheet, String(data.id));
      if (rowIndex > -1) sheet.deleteRow(rowIndex);
      return jsonResponse({ status: 'success', message: 'Idea deleted' });
    }

    // ==========================================
    // โหมด 7: อัพโหลดไฟล์ไปยัง Google Drive
    // ==========================================
    if (action === 'uploadFile') {
      const folder = DriveApp.getFolderById(ATTACHMENTS_FOLDER_ID || FOLDER_ID);
      const bytes = Utilities.base64Decode(data.base64);
      const blob = Utilities.newBlob(bytes, data.mimeType || 'application/octet-stream', data.name || 'attachment');
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return jsonResponse({
        status: 'success',
        url: 'https://drive.google.com/file/d/' + file.getId() + '/view',
        driveId: file.getId()
      });
    }

    return jsonResponse({ status: 'error', message: `Unknown action: ${action}` });

  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

// ==========================================
// ฟังก์ชันช่วยค้นหา row index ตาม ID (column A)
// คืนค่า row number (1-indexed) หรือ -1 ถ้าไม่พบ
// ==========================================
function findRowById(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) return i + 1;
  }
  return -1;
}

// ==========================================
// ฟังก์ชันช่วย return JSON response
// ==========================================
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =================================================================
// โค้ดสร้าง PDF (ฟังก์ชันสร้างไฟล์ PDF และแชร์สิทธิ์)
// =================================================================

function createInvoicePDF(data) {
  let itemsHtml = '';
  if (data.items && data.items.length > 0) {
    data.items.forEach((item, index) => {
      let amount = (item.qty * item.price).toLocaleString('th-TH', {minimumFractionDigits: 2});
      let price = Number(item.price).toLocaleString('th-TH', {minimumFractionDigits: 2});
      itemsHtml += `
        <tr>
          <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.desc}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${item.qty}</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${price}</td>
          <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${amount}</td>
        </tr>
      `;
    });
  } else {
    itemsHtml = `<tr><td colspan="5" style="text-align:center; padding:8px;">ไม่มีรายการ</td></tr>`;
  }

  const subtotalStr = Number(data.subtotal).toLocaleString('th-TH', {minimumFractionDigits: 2});
  const vatStr = Number(data.vat).toLocaleString('th-TH', {minimumFractionDigits: 2});
  const totalStr = Number(data.total).toLocaleString('th-TH', {minimumFractionDigits: 2});

  const htmlTemplate = `
  <!DOCTYPE html>
  <html lang="th">
  <head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Sarabun', sans-serif; font-size: 14px; color: #333; line-height: 1.5; margin: 0; padding: 20px 40px; }
      .header-container { width: 100%; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
      .title-box { text-align: right; }
      .doc-title { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0 0 10px 0; }
      .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      .info-table td { vertical-align: top; }
      .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      .items-table th { background-color: #f3f4f6; color: #333; font-weight: bold; border: 1px solid #ddd; padding: 10px 8px; text-align: center; }
      .totals-box { width: 300px; float: right; border-collapse: collapse; }
      .totals-box td { padding: 8px; border: 1px solid #ddd; }
      .totals-box .bg-gray { background-color: #f3f4f6; font-weight: bold; }
      .footer-sign { width: 100%; margin-top: 50px; table-layout: fixed; }
      .sign-box { text-align: center; width: 45%; }
      .sign-line { border-bottom: 1px solid #333; width: 80%; margin: 40px auto 10px auto; }
      .clear { clear: both; }
    </style>
  </head>
  <body>
    <table class="info-table">
      <tr>
        <td style="width: 60%;">
          <div style="font-size: 18px; font-weight: bold; color: #1e3a8a; margin-bottom: 10px;">\${data.businessName || 'MODTY.AI (ศศิวรรณ จันทร์แดง)'}</div>
        </td>
        <td class="title-box" style="width: 40%;">
          <div class="doc-title">ใบเสนอราคา<br><span style="font-size: 16px;">(QUOTATION)</span></div>
        </td>
      </tr>
    </table>

    <table class="info-table">
      <tr>
        <td style="width: 55%; padding-right: 20px;">
          <strong>ผู้เสนอราคา:</strong><br>
          \${data.businessAddress || '5/4 หมู่6 ตำบล เขาวง อำเภอ พระพุทธบาท<br>จังหวัด สระบุรี 18120'}<br>
          เลขผู้เสียภาษี: \${data.businessTaxId || '1199600115041'}<br>
          \${data.businessContact || 'โทร: +66-99102-9991 | Email: modty.project@yahoo.com'}
        </td>
        <td style="width: 45%; background-color: #f9fafb; padding: 10px; border-radius: 5px; border: 1px solid #eee;">
          <table style="width: 100%;">
            <tr><td style="width: 40%;"><strong>เลขที่:</strong></td><td>\${data.docNumber}</td></tr>
            <tr><td><strong>วันที่:</strong></td><td>\${data.issueDate}</td></tr>
            <tr><td><strong>กำหนดยืนราคา:</strong></td><td>30 วัน</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #1e3a8a; border-radius: 5px;">
      <strong>ลูกค้า:</strong> \${data.clientName}<br>
      <strong>ที่อยู่:</strong> \${data.clientAddress}<br>
      <strong>เลขประจําตัวผู้เสียภาษี:</strong> \${data.clientTaxId || '-'}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 8%;">ลำดับ</th>
          <th style="width: 47%;">รายละเอียด</th>
          <th style="width: 12%;">จํานวน</th>
          <th style="width: 15%;">ราคาหน่วยละ<br>(บาท)</th>
          <th style="width: 18%;">ราคารวม<br>(บาท)</th>
        </tr>
      </thead>
      <tbody>
        \${itemsHtml}
      </tbody>
    </table>

    <div>
      <div style="float: left; width: 50%;">
        <strong>เงื่อนไขการชำระเงิน:</strong><br>
        ชำระเงินเต็มจํานวน (ยอดรวมภาษีมูลค่าเพิ่ม \${totalStr} บาท)<br><br>
        <strong>รายละเอียดการชำระเงิน:</strong><br>
        ชำระเงินผ่านบัญชีธนาคาร<br>
        \${data.bankDetails || 'ธนาคารกสิกรไทย สาขาโรบินสันสระบุรี<br>เลขบัญชี: 160-2-46775-5'}
      </div>
      
      <table class="totals-box">
        <tr><td class="bg-gray">ราคาก่อนภาษีมูลค่าเพิ่ม</td><td style="text-align: right;">\${subtotalStr}</td></tr>
        <tr><td class="bg-gray">ภาษีมูลค่าเพิ่ม 7%</td><td style="text-align: right;">\${vatStr}</td></tr>
        <tr><td class="bg-gray" style="font-size: 16px;">ยอดชำระสุทธิ</td><td style="text-align: right; font-weight: bold; font-size: 16px; color: #1e3a8a;">\${totalStr}</td></tr>
      </table>
      <div class="clear"></div>
    </div>

    <table class="footer-sign">
      <tr>
        <td class="sign-box">การยืนยันอนุมัติ<br>ข้าพเจ้าได้รับทราบและตกลงยอมรับเงื่อนไข<br><div class="sign-line"></div>(ตัวแทน \${data.clientName})<br>วันที่: ______/______/______</td>
        <td class="sign-box">ผู้ออกใบเสนอราคา<br><br><div class="sign-line"></div>(\${data.ownerName || 'ศศิวรรณ จันทร์แดง'})<br>วันที่: \${data.issueDate}</td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // แปลง HTML เป็น Blob PDF และบันทึกลง Drive
  const blob = Utilities.newBlob(htmlTemplate, MimeType.HTML)
                        .setName(`${data.docType || 'QUOTATION'}_${data.docNumber}_${data.clientName}.pdf`)
                        .getAs(MimeType.PDF);
                        
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const pdfFile = folder.createFile(blob);
  
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const fileUrl = pdfFile.getUrl();

  // บันทึกลง Sheet (Docs_DB)
  const docHeaders = ['Timestamp', 'DocNumber', 'ClientName', 'Total', 'FileUrl'];
  const sheet = getOrCreateSheet(getSpreadsheet(), 'Docs_DB', docHeaders);
  sheet.appendRow([new Date(), data.docNumber, data.clientName, data.total, fileUrl]);

  return fileUrl;
}

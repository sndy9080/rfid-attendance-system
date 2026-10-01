var ss = SpreadsheetApp.openById('1St9ZjJjanKGvqmOiO7bXEDhEeF3xYXz__Rn********'); // Masukkan ID Google Sheets di sini
var sheet = ss.getSheetByName('Sheet1');
var timezone = "Asia/Jakarta"; // Zona waktu

function doGet(e) {
  Logger.log(JSON.stringify(e));

  if (typeof e !== 'undefined') {
    var nim = stripQuotes(e.parameters.nim);
    var name = getNAME(nim);

    if (name !== '') {
      markAttendanceAndReturnPhotoUrl(nim);
      var photoUrl = showStudentPhoto(nim); // Ambil URL foto mahasiswa
      if (photoUrl !== '') {
        var directPhotoUrl = convertToDirectLink(photoUrl);
        var output = name + " has been marked as 'Hadir'\n" + "Photo URL: " + directPhotoUrl;
        sendWhatsAppMessage(nim, name, directPhotoUrl); // Kirim pesan WhatsApp dengan foto
        return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.TEXT);
      } else {
        return ContentService.createTextOutput(name + " has been marked as 'Hadir'\n" + "Photo not available");
      }
    } else {
      return ContentService.createTextOutput("Nim not found in database");
    }
  } else {
    return ContentService.createTextOutput("Received data is undefined");
  }
}

function stripQuotes(value) {
  return value.toString().replace(/^["']|['"]$/g, "");
}

function getNAME(nim) {
  var lastRow = sheet.getLastRow();
  var nimColumn = 1; // Kolom NIM di Google Sheets (misalnya kolom A)
  var nameColumn = 3; // Kolom nama di Google Sheets (misalnya kolom C)

  for (var i = 10; i <= lastRow; i++) {
    var cellNim = sheet.getRange(i, nimColumn).getValue().toString();
    if (cellNim.toLowerCase() === nim.toLowerCase()) {
      return sheet.getRange(i, nameColumn).getValue().toString();
    }
  }
  return '';
}

function markAttendanceAndReturnPhotoUrl(nim) {
  var lastRow = sheet.getLastRow();
  var nimColumn = 1; // Kolom nim di Google Sheets (misalnya kolom A)
  var firstMeetingColumn = 4; // Kolom pertemuan 1 untuk di tandai kehadirannya (misalnya kolom D)
  var numMeetings = 16; // Jumlah pertemuan yang ingin Anda tandai

  for (var i = 10; i <= lastRow; i++) {
    var cellNim = sheet.getRange(i, nimColumn).getValue().toString();
    if (cellNim.toLowerCase() === nim.toLowerCase()) {
      // Cari pertemuan pertama yang belum diisi ('')
      for (var j = firstMeetingColumn; j <= firstMeetingColumn + numMeetings - 1; j++) {
        var cellAttendance = sheet.getRange(i, j);
        if (cellAttendance.getValue() === '') {
          var date = new Date();
          var formattedDate = Utilities.formatDate(date, timezone, 'dd/MM/yyyy HH:mm:ss'); // Format tanggal dan waktu sesuai dengan zona waktu
          cellAttendance.setValue('Hadir (' + formattedDate + ')');

          // Kosongkan pertemuan sebelumnya yang belum diisi
          if (j > firstMeetingColumn) {
            var previousAttendance = sheet.getRange(i, j - 1);
            if (previousAttendance.getValue() === '') {
              previousAttendance.setValue('');
            }
          }
          
          return; // Keluar dari fungsi setelah berhasil menandai kehadiran
        }
      }
      break;
    }
  }
}

function showStudentPhoto(nim) {
  var lastRow = sheet.getLastRow();
  var nimColumn = 1; // Kolom NIM di Google Sheets (misalnya kolom A)
  var photoColumn = 2; // Kolom foto di Google Sheets (misalnya kolom B)

  for (var i = 10; i <= lastRow; i++) {
    var cellNim = sheet.getRange(i, nimColumn).getValue().toString();
    if (cellNim.toLowerCase() === nim.toLowerCase()) {
      return sheet.getRange(i, photoColumn).getValue().toString();
    }
  }
  return '';
}

function convertToDirectLink(photoUrl) {
  // Ubah URL Google Drive menjadi URL langsung
  var fileId = photoUrl.match(/[-\w]{25,}/);
  if (fileId) {
    return 'https://drive.google.com/uc?export=view&id=' + fileId[0];
  }
  return '';
}

function sendWhatsAppMessage(nim, name, photoUrl) {
  var accountSid = 'AC9baf6b6c56955876e32fa682********'; 
  var authToken = '2b8275319aedf3a12f1a4b6b********'; 
  var from = 'whatsapp:+1415523****'; // Twilio sandbox WhatsApp number
  var to = 'whatsapp:+62881288****'; // Nomor WhatsApp tujuan
  var date = new Date();
  var formattedDate = Utilities.formatDate(date, timezone, 'dd/MM/yyyy HH:mm:ss'); // Format tanggal dan waktu sesuai dengan zona waktu

  var message = 'Nama: ' + name + '\nNIM: ' + nim + '\nWaktu: ' + formattedDate;

  var url = 'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json';

  var payload = {
    To: to,
    From: from,
    Body: message,
    MediaUrl: photoUrl // URL langsung ke gambar
  };

  var options = {
    method: 'post',
    payload: payload,
    headers: {
      Authorization: 'Basic ' + Utilities.base64Encode(accountSid + ':' + authToken)
    }
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    Logger.log('Response Code: ' + response.getResponseCode());
    Logger.log('Response Content: ' + response.getContentText());
  } catch (error) {
    Logger.log('Error: ' + error.message);
  }
}

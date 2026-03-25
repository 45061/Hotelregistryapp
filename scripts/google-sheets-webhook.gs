const SHEET_NAME = 'Reservations';
const HEADER_ROW = [
  'reservationId',
  'guestName',
  'travelerId',
  'roomId',
  'roomNumber',
  'hotel',
  'roomType',
  'checkIn',
  'checkOut',
  'status',
  'source',
  'notes',
  'sheetRowId',
  'createdAt',
  'updatedAt',
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'Missing request body' }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'upsert';
    const sheet = getReservationsSheet();

    if (action === 'bulk_upsert') {
      const reservations = Array.isArray(payload.reservations) ? payload.reservations : [];
      reservations.forEach((reservation) => upsertReservation(sheet, reservation));

      return jsonResponse({
        success: true,
        action,
        processed: reservations.length,
      });
    }

    if (action === 'upsert') {
      upsertReservation(sheet, payload.reservation);
      return jsonResponse({ success: true, action, processed: 1 });
    }

    if (action === 'delete') {
      deleteReservation(sheet, payload.reservation);
      return jsonResponse({ success: true, action, processed: 1 });
    }

    return jsonResponse({ success: false, error: `Unsupported action: ${action}` }, 400);
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message || 'Unexpected Google Apps Script error',
    }, 500);
  }
}

function getReservationsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const currentHeaders = sheet.getRange(1, 1, 1, HEADER_ROW.length).getValues()[0];
  const isHeaderMissing = HEADER_ROW.some((header, index) => currentHeaders[index] !== header);

  if (isHeaderMissing) {
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function upsertReservation(sheet, reservation) {
  if (!reservation || !reservation.reservationId) {
    throw new Error('reservationId is required');
  }

  const rowIndex = findReservationRow(sheet, reservation.reservationId);
  const rowValues = mapReservationToRow(reservation);

  if (rowIndex) {
    sheet.getRange(rowIndex, 1, 1, HEADER_ROW.length).setValues([rowValues]);
    return rowIndex;
  }

  sheet.appendRow(rowValues);
  return sheet.getLastRow();
}

function deleteReservation(sheet, reservation) {
  if (!reservation || !reservation.reservationId) {
    throw new Error('reservationId is required');
  }

  const rowIndex = findReservationRow(sheet, reservation.reservationId);
  if (rowIndex) {
    sheet.deleteRow(rowIndex);
  }
}

function findReservationRow(sheet, reservationId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return null;
  }

  const idColumnValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let index = 0; index < idColumnValues.length; index += 1) {
    if (String(idColumnValues[index][0]) === String(reservationId)) {
      return index + 2;
    }
  }

  return null;
}

function mapReservationToRow(reservation) {
  return [
    reservation.reservationId || '',
    reservation.guestName || '',
    reservation.travelerId || '',
    reservation.roomId || '',
    reservation.roomNumber || '',
    reservation.hotel || '',
    reservation.roomType || '',
    reservation.checkIn || '',
    reservation.checkOut || '',
    reservation.status || '',
    reservation.source || '',
    reservation.notes || '',
    reservation.sheetRowId || '',
    reservation.createdAt || '',
    reservation.updatedAt || '',
  ];
}

function jsonResponse(payload, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify({ ...payload, statusCode }))
    .setMimeType(ContentService.MimeType.JSON);
}

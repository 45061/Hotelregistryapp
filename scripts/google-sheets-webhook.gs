const RAW_SHEET_NAME = 'Reservations';
const RAW_HEADER_ROW = [
  'reservationId',
  'guestName',
  'phoneNumber',
  'email',
  'hasIva',
  'paymentMethod',
  'guestCount',
  'roomPrice',
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

const CALENDAR_SHEETS = [
  {
    hotel: 'Oporto 83',
    sheetName: 'OPORTO',
    headerLabel: 'OPORTO',
  },
  {
    hotel: 'Natural Sevgi',
    sheetName: 'NATURAL',
    headerLabel: 'NATURAL',
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'Missing request body' }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'upsert';
    const rawSheet = getReservationsSheet();

    if (action === 'bulk_upsert') {
      const reservations = Array.isArray(payload.reservations) ? payload.reservations : [];
      reservations.forEach((reservation) => upsertReservation(rawSheet, reservation));
      rebuildCalendarViews();

      return jsonResponse({
        success: true,
        action,
        processed: reservations.length,
      });
    }

    if (action === 'upsert') {
      upsertReservation(rawSheet, payload.reservation);
      rebuildCalendarViews();
      return jsonResponse({ success: true, action, processed: 1 });
    }

    if (action === 'delete') {
      deleteReservation(rawSheet, payload.reservation);
      rebuildCalendarViews();
      return jsonResponse({ success: true, action, processed: 1 });
    }

    return jsonResponse({ success: false, error: `Unsupported action: ${action}` }, 400);
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message || 'Unexpected Google Apps Script error',
      },
      500
    );
  }
}

function getReservationsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(RAW_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(RAW_SHEET_NAME);
  }

  const currentHeaders = sheet.getRange(1, 1, 1, RAW_HEADER_ROW.length).getValues()[0];
  const isHeaderMissing = RAW_HEADER_ROW.some((header, index) => currentHeaders[index] !== header);

  if (isHeaderMissing) {
    sheet.clear();
    sheet.getRange(1, 1, 1, RAW_HEADER_ROW.length).setValues([RAW_HEADER_ROW]);
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
    sheet.getRange(rowIndex, 1, 1, RAW_HEADER_ROW.length).setValues([rowValues]);
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
    reservation.phoneNumber || '',
    reservation.email || '',
    reservation.hasIva ? 'SI' : 'NO',
    reservation.paymentMethod || '',
    reservation.guestCount || '',
    reservation.roomPrice || '',
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

function rebuildCalendarViews() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const reservations = getAllReservationsFromRawSheet();

  CALENDAR_SHEETS.forEach((config) => {
    const hotelReservations = reservations
      .filter((reservation) => reservation.hotel === config.hotel)
      .sort((left, right) => left.checkInDate.getTime() - right.checkInDate.getTime());

    renderHotelCalendarSheet(spreadsheet, config, hotelReservations);
  });
}

function getAllReservationsFromRawSheet() {
  const sheet = getReservationsSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, RAW_HEADER_ROW.length).getValues();

  return values
    .map((row) => rowToReservation(row))
    .filter((reservation) => reservation && reservation.reservationId && reservation.hotel);
}

function rowToReservation(row) {
  const reservation = {
    reservationId: String(row[0] || ''),
    guestName: String(row[1] || ''),
    phoneNumber: String(row[2] || ''),
    email: String(row[3] || ''),
    hasIva: String(row[4] || '').toUpperCase() === 'SI',
    paymentMethod: String(row[5] || ''),
    guestCount: Number(row[6] || 0),
    roomPrice: Number(row[7] || 0),
    travelerId: String(row[8] || ''),
    roomId: String(row[9] || ''),
    roomNumber: String(row[10] || ''),
    hotel: String(row[11] || ''),
    roomType: String(row[12] || ''),
    checkIn: row[13],
    checkOut: row[14],
    status: String(row[15] || ''),
    source: String(row[16] || ''),
    notes: String(row[17] || ''),
    sheetRowId: String(row[18] || ''),
    createdAt: row[19],
    updatedAt: row[20],
  };

  const checkInDate = toSheetDate(reservation.checkIn);
  const checkOutDate = toSheetDate(reservation.checkOut);

  if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
    return null;
  }

  reservation.checkInDate = checkInDate;
  reservation.checkOutDate = checkOutDate;
  return reservation;
}

function renderHotelCalendarSheet(spreadsheet, config, reservations) {
  const sheet = getOrCreateSheet(spreadsheet, config.sheetName);
  sheet.clear();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();
  removeAllMerges(sheet);

  const fallbackStart = startOfDay(new Date());
  const fallbackEnd = addDays(fallbackStart, 14);
  const range = getDateRange(reservations, fallbackStart, fallbackEnd);
  const roomLabels = getRoomLabels(reservations);

  const totalColumns = 1 + range.days.length;
  const totalRows = 1 + Math.max(roomLabels.length, 1);

  if (sheet.getMaxRows() < totalRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), totalRows - sheet.getMaxRows());
  }

  if (sheet.getMaxColumns() < totalColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), totalColumns - sheet.getMaxColumns());
  }

  const headerValues = [[config.headerLabel].concat(range.days.map(formatHeaderDate))];
  sheet.getRange(1, 1, 1, totalColumns).setValues(headerValues);

  const roomColumnValues = roomLabels.length
    ? roomLabels.map((label) => [label])
    : [['Sin reservas']];

  sheet.getRange(2, 1, roomColumnValues.length, 1).setValues(roomColumnValues);

  styleCalendarShell(sheet, totalRows, totalColumns);

  const roomRowMap = {};
  roomLabels.forEach((label, index) => {
    roomRowMap[label] = index + 2;
  });

  reservations.forEach((reservation) => {
    const roomLabel = formatRoomLabel(reservation);
    const row = roomRowMap[roomLabel];

    if (!row) {
      return;
    }

    const startColumn = 2 + getDayIndex(range.start, reservation.checkInDate);
    const spanDays = Math.max(1, getDayIndex(reservation.checkInDate, reservation.checkOutDate));
    const endColumn = Math.min(startColumn + spanDays - 1, totalColumns);
    const width = Math.max(1, endColumn - startColumn + 1);
    const targetRange = sheet.getRange(row, startColumn, 1, width);

    if (width > 1) {
      targetRange.mergeAcross();
    }

    targetRange
      .setValue(buildReservationCellText(reservation))
      .setWrap(true)
      .setVerticalAlignment('top')
      .setHorizontalAlignment('left')
      .setBackground(getReservationColor(reservation.status))
      .setFontColor(getReservationFontColor(reservation.status))
      .setFontWeight('bold')
      .setBorder(true, true, true, true, true, true, '#22cbd0', SpreadsheetApp.BorderStyle.SOLID);
  });
}

function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  return sheet;
}

function styleCalendarShell(sheet, totalRows, totalColumns) {
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  sheet.setColumnWidth(1, 165);

  for (let column = 2; column <= totalColumns; column += 1) {
    sheet.setColumnWidth(column, 132);
  }

  for (let row = 2; row <= totalRows; row += 1) {
    sheet.setRowHeight(row, 132);
  }

  sheet.getRange(1, 1, 1, totalColumns)
    .setBackground('#f8fafc')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(2, 1, Math.max(totalRows - 1, 1), 1)
    .setBackground('#f8fafc')
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);

  if (totalRows > 1 && totalColumns > 1) {
    sheet.getRange(2, 2, totalRows - 1, totalColumns - 1)
      .setBackground('#ffffff')
      .setBorder(true, true, true, true, true, true, '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID);
  }
}

function getDateRange(reservations, fallbackStart, fallbackEnd) {
  if (!reservations.length) {
    const days = [];
    for (let current = new Date(fallbackStart); current < fallbackEnd; current = addDays(current, 1)) {
      days.push(new Date(current));
    }

    return {
      start: fallbackStart,
      end: fallbackEnd,
      days,
    };
  }

  const minCheckIn = reservations.reduce((min, reservation) =>
    reservation.checkInDate < min ? reservation.checkInDate : min,
  reservations[0].checkInDate);
  const maxCheckOut = reservations.reduce((max, reservation) =>
    reservation.checkOutDate > max ? reservation.checkOutDate : max,
  reservations[0].checkOutDate);

  const start = startOfDay(minCheckIn);
  const end = startOfDay(maxCheckOut);
  const days = [];

  for (let current = new Date(start); current < end; current = addDays(current, 1)) {
    days.push(new Date(current));
  }

  return { start, end, days };
}

function getRoomLabels(reservations) {
  const unique = {};

  reservations.forEach((reservation) => {
    unique[formatRoomLabel(reservation)] = true;
  });

  return Object.keys(unique).sort(naturalSort);
}

function formatRoomLabel(reservation) {
  const roomType = reservation.roomType || 'Sin categoría';
  const roomNumber = reservation.roomNumber || 'Sin asignar';
  return `${roomType}: ${roomNumber}`;
}

function buildReservationCellText(reservation) {
  const lines = [
    `HUESPED: ${reservation.guestName || 'Sin nombre'}`,
    `N° PERSONAS: ${reservation.guestCount || 'Sin dato'}`,
    `FECHAS: ${formatShortDate(reservation.checkInDate)} - ${formatShortDate(reservation.checkOutDate)}`,
    `PRECIO: ${formatCurrency(reservation.roomPrice)}`,
    `IVA: ${reservation.hasIva ? 'Sí' : 'No'}`,
    `FORMA DE PAGO: ${reservation.paymentMethod || 'Sin especificar'}`,
    `RESERVA: ${reservation.source || 'Sin especificar'}`,
    `CELL: ${reservation.phoneNumber || 'Sin dato'}`,
    `EMAIL: ${reservation.email || 'Sin dato'}`,
  ];

  if (reservation.notes) {
    lines.push(`NOTAS: ${reservation.notes}`);
  }

  return lines.join('\n');
}

function getReservationColor(status) {
  switch (status) {
    case 'confirmed':
      return '#22c55e';
    case 'checked_in':
      return '#ef4444';
    case 'checked_out':
      return '#7dd3fc';
    case 'noshow':
      return '#c4b5fd';
    case 'cancelled':
      return '#cbd5e1';
    case 'unassigned':
      return '#fcd34d';
    default:
      return '#22c55e';
  }
}

function getReservationFontColor(status) {
  switch (status) {
    case 'confirmed':
    case 'checked_in':
      return '#ffffff';
    default:
      return '#111827';
  }
}

function formatHeaderDate(date) {
  const day = date.getDate();
  const month = getMonthLabel(date.getMonth());
  return `${day}/${month}`;
}

function formatShortDate(date) {
  return `${date.getDate()} ${getMonthLabel(date.getMonth())}`;
}

function getMonthLabel(monthIndex) {
  const labels = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return labels[monthIndex];
}

function formatCurrency(value) {
  if (!value) {
    return 'Sin valor';
  }

  return '$' + Number(value).toLocaleString('es-CO');
}

function getDayIndex(startDate, targetDate) {
  return Math.floor((startOfDay(targetDate).getTime() - startOfDay(startDate).getTime()) / DAY_MS);
}

function addDays(date, days) {
  return new Date(startOfDay(date).getTime() + days * DAY_MS);
}

function startOfDay(date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function toSheetDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
}

function naturalSort(left, right) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

function removeAllMerges(sheet) {
  const merges = sheet.getDataRange().getMergedRanges();
  merges.forEach((range) => range.breakApart());
}

function jsonResponse(payload, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify({ ...payload, statusCode }))
    .setMimeType(ContentService.MimeType.JSON);
}

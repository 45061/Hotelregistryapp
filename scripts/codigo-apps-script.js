// ============================================================================
// ATAMSA - Webhook de Google Sheets para Calendario y Respaldo Visual de Reservas
// Archivo listo para copiar y pegar directamente en Extensiones > Apps Script
// ============================================================================

const RAW_SHEET_NAME = 'Reservations';
const RAW_HISTORICO_SHEET_NAME = 'Reservations_Historico';

const RAW_HEADER_ROW = [
  'reservationId',
  'guestName',
  'phoneNumber',
  'email',
  'hasIva',
  'paymentMethod',
  'guestCount',
  'roomPrice',
  'ivaAmount',
  'roomPriceWithoutIva',
  'roomPriceWithIva',
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
const BASE_FONT_SIZE = 10;
const NOTES_FONT_SIZE = BASE_FONT_SIZE + 2; // 12 pt
const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'Missing request body' }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'upsert';
    const rawSheet = getReservationsSheet();
    const historicoSheet = getReservationsHistoricoSheet();

    if (action === 'bulk_upsert') {
      const reservations = Array.isArray(payload.reservations) ? payload.reservations : [];

      pruneExpiredReservations(rawSheet);

      reservations.forEach(function (reservation) {
        if (isReservationInAllowedWindow(reservation)) {
          upsertReservation(rawSheet, reservation);
          deleteReservation(historicoSheet, reservation);
        } else {
          const rowValues = mapReservationToRow(reservation);
          upsertReservationRow(historicoSheet, rowValues);
          deleteReservation(rawSheet, reservation);
        }
      });

      rebuildCalendarViews();

      return jsonResponse({
        success: true,
        action: action,
        processed: reservations.length,
      });
    }

    if (action === 'upsert') {
      if (isReservationInAllowedWindow(payload.reservation)) {
        upsertReservation(rawSheet, payload.reservation);
        deleteReservation(historicoSheet, payload.reservation);
      } else {
        const rowValues = mapReservationToRow(payload.reservation);
        upsertReservationRow(historicoSheet, rowValues);
        deleteReservation(rawSheet, payload.reservation);
      }
      rebuildCalendarViews();
      return jsonResponse({ success: true, action: action, processed: 1 });
    }

    if (action === 'delete') {
      deleteReservation(rawSheet, payload.reservation);
      deleteReservation(historicoSheet, payload.reservation);
      rebuildCalendarViews();
      return jsonResponse({ success: true, action: action, processed: 1 });
    }

    return jsonResponse({ success: false, error: 'Unsupported action: ' + action }, 400);
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
  const isHeaderMissing = RAW_HEADER_ROW.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

  if (isHeaderMissing) {
    sheet.clear();
    sheet.getRange(1, 1, 1, RAW_HEADER_ROW.length).setValues([RAW_HEADER_ROW]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getReservationsHistoricoSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(RAW_HISTORICO_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(RAW_HISTORICO_SHEET_NAME);
  }

  const currentHeaders = sheet.getRange(1, 1, 1, RAW_HEADER_ROW.length).getValues()[0];
  const isHeaderMissing = RAW_HEADER_ROW.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

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

function upsertReservationRow(sheet, rowValues) {
  const resId = rowValues[0];
  if (!resId) return;

  const existingRow = findReservationRow(sheet, resId);
  if (existingRow) {
    sheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function deleteReservation(sheet, reservation) {
  if (!reservation || !reservation.reservationId) {
    return;
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
    reservation.ivaAmount || '',
    reservation.roomPriceWithoutIva || '',
    reservation.roomPriceWithIva || '',
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
  const rawSheet = getReservationsSheet();
  const historicoSheet = getReservationsHistoricoSheet();

  // Migrar cualquier hoja previa tabular de historial si existía
  migrateOldTabularHistorialSheets(spreadsheet, historicoSheet);

  // 1. Renderizar vistas activas (OPORTO y NATURAL: mes actual y 2 siguientes)
  const activeReservations = getAllReservationsFromRawSheet();
  const activeRange = getAllowedDateWindowRange();

  CALENDAR_SHEETS.forEach(function (config) {
    const hotelReservations = activeReservations
      .filter(function (reservation) {
        return reservation.hotel === config.hotel;
      })
      .sort(function (left, right) {
        return left.checkInDate.getTime() - right.checkInDate.getTime();
      });

    renderCalendarGrid(
      spreadsheet,
      config.sheetName,
      config.headerLabel,
      config.hotel,
      hotelReservations,
      activeRange
    );
  });

  // 2. Renderizar vistas de calendario históricas por mes y hotel
  const historicalReservations = getAllReservationsFromHistoricoSheet();
  if (historicalReservations.length > 0) {
    const monthMap = {};
    historicalReservations.forEach(function (res) {
      const date = res.checkOutDate || res.checkInDate;
      if (date) {
        const key = date.getFullYear() + '-' + date.getMonth();
        monthMap[key] = { year: date.getFullYear(), month: date.getMonth() };
      }
    });

    const sortedMonthKeys = Object.keys(monthMap).sort(function (a, b) {
      const partsA = a.split('-').map(Number);
      const partsB = b.split('-').map(Number);
      return partsA[0] !== partsB[0] ? partsA[0] - partsB[0] : partsA[1] - partsB[1];
    });

    sortedMonthKeys.forEach(function (key) {
      const monthInfo = monthMap[key];
      const monthRange = getMonthDateRange(monthInfo.year, monthInfo.month);

      CALENDAR_SHEETS.forEach(function (config) {
        const monthHotelReservations = historicalReservations
          .filter(function (res) {
            return (
              res.hotel === config.hotel &&
              res.checkOutDate > monthRange.start &&
              res.checkInDate < monthRange.end
            );
          })
          .sort(function (left, right) {
            return left.checkInDate.getTime() - right.checkInDate.getTime();
          });

        if (monthHotelReservations.length > 0) {
          const historicalSheetName = config.sheetName + ' - ' + MONTH_NAMES_ES[monthInfo.month] + ' ' + monthInfo.year;
          const historicalHeaderLabel = config.headerLabel + ' (' + MONTH_NAMES_ES[monthInfo.month] + ' ' + monthInfo.year + ')';

          renderCalendarGrid(
            spreadsheet,
            historicalSheetName,
            historicalHeaderLabel,
            config.hotel,
            monthHotelReservations,
            monthRange
          );
        }
      });
    });
  }
}

function migrateOldTabularHistorialSheets(spreadsheet, historicoSheet) {
  const sheets = spreadsheet.getSheets();
  sheets.forEach(function (sheet) {
    const name = sheet.getName();
    if (name.indexOf('Historial ') === 0 && name.indexOf(' - ') === -1 && name !== RAW_HISTORICO_SHEET_NAME) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const rows = sheet.getRange(2, 1, lastRow - 1, RAW_HEADER_ROW.length).getValues();
        rows.forEach(function (rowValues) {
          const resId = rowValues[0];
          if (resId) {
            const existing = findReservationRow(historicoSheet, resId);
            if (!existing) {
              historicoSheet.appendRow(rowValues);
            }
          }
        });
      }
      try {
        spreadsheet.deleteSheet(sheet);
      } catch (err) {
        // En caso de que no se pueda borrar la última hoja
      }
    }
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
    .map(function (row) {
      return rowToReservation(row);
    })
    .filter(function (reservation) {
      return (
        reservation &&
        reservation.reservationId &&
        reservation.hotel &&
        isReservationInAllowedWindow(reservation)
      );
    });
}

function getAllReservationsFromHistoricoSheet() {
  const sheet = getReservationsHistoricoSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, RAW_HEADER_ROW.length).getValues();

  return values
    .map(function (row) {
      return rowToReservation(row);
    })
    .filter(function (reservation) {
      return reservation && reservation.reservationId && reservation.hotel;
    });
}

function isReservationInAllowedWindow(reservation) {
  if (!reservation) return false;
  const checkIn = reservation.checkInDate || toSheetDate(reservation.checkIn);
  const checkOut = reservation.checkOutDate || toSheetDate(reservation.checkOut);
  if (!checkIn || !checkOut) return false;

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfWindow = new Date(now.getFullYear(), now.getMonth() + 3, 1, 0, 0, 0, 0);

  return checkOut > startOfCurrentMonth && checkIn < endOfWindow;
}

function getAllowedDateWindowRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 3, 1, 0, 0, 0, 0);
  const days = [];
  for (let current = new Date(start); current < end; current = addDays(current, 1)) {
    days.push(new Date(current));
  }
  return { start: start, end: end, days: days };
}

function getMonthDateRange(year, month) {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
  const days = [];
  for (let current = new Date(start); current < end; current = addDays(current, 1)) {
    days.push(new Date(current));
  }
  return { start: start, end: end, days: days };
}

function getHeaderColumnIndex(sheet, headerName) {
  const lastCol = sheet.getLastColumn() || RAW_HEADER_ROW.length;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (let i = 0; i < headers.length; i += 1) {
    if (String(headers[i]).trim().toLowerCase() === headerName.toLowerCase()) {
      return i;
    }
  }
  return -1;
}

function pruneExpiredReservations(rawSheet) {
  const lastRow = rawSheet.getLastRow();
  if (lastRow < 2) return;

  const historicoSheet = getReservationsHistoricoSheet();
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const checkOutColIdx = getHeaderColumnIndex(rawSheet, 'checkOut');
  const colIdx = checkOutColIdx !== -1 ? checkOutColIdx : 17;
  const totalCols = rawSheet.getLastColumn() || RAW_HEADER_ROW.length;

  for (let rowIndex = lastRow; rowIndex >= 2; rowIndex -= 1) {
    const rowValues = rawSheet.getRange(rowIndex, 1, 1, totalCols).getValues()[0];
    const checkOutVal = rowValues[colIdx];
    const checkOutDate = toSheetDate(checkOutVal);

    if (checkOutDate && checkOutDate <= startOfCurrentMonth) {
      upsertReservationRow(historicoSheet, rowValues);
      rawSheet.deleteRow(rowIndex);
    }
  }
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
    ivaAmount: Number(row[8] || 0),
    roomPriceWithoutIva: Number(row[9] || 0),
    roomPriceWithIva: Number(row[10] || 0),
    travelerId: String(row[11] || ''),
    roomId: String(row[12] || ''),
    roomNumber: String(row[13] || ''),
    hotel: String(row[14] || ''),
    roomType: String(row[15] || ''),
    checkIn: row[16],
    checkOut: row[17],
    status: String(row[18] || ''),
    source: String(row[19] || ''),
    notes: String(row[20] || ''),
    sheetRowId: String(row[21] || ''),
    createdAt: row[22],
    updatedAt: row[23],
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

function renderCalendarGrid(spreadsheet, sheetName, headerLabel, hotel, reservations, range) {
  const sheet = getOrCreateSheet(spreadsheet, sheetName);
  sheet.clear();
  sheet.clearFormats();
  sheet.clearConditionalFormatRules();
  removeAllMerges(sheet);

  const roomLabels = getRoomLabels(reservations);

  const totalColumns = 1 + range.days.length;
  const totalRows = 1 + Math.max(roomLabels.length, 1);

  if (sheet.getMaxRows() < totalRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), totalRows - sheet.getMaxRows());
  }

  if (sheet.getMaxColumns() < totalColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), totalColumns - sheet.getMaxColumns());
  }

  const headerValues = [[headerLabel].concat(range.days.map(formatHeaderDate))];
  sheet.getRange(1, 1, 1, totalColumns).setValues(headerValues);

  const roomColumnValues = roomLabels.length
    ? roomLabels.map(function (label) {
        return [label];
      })
    : [['Sin reservas']];

  sheet.getRange(2, 1, roomColumnValues.length, 1).setValues(roomColumnValues);

  styleCalendarShell(sheet, totalRows, totalColumns);

  const roomRowMap = {};
  roomLabels.forEach(function (label, index) {
    roomRowMap[label] = index + 2;
  });

  reservations.forEach(function (reservation) {
    const roomLabel = formatRoomLabel(reservation);
    const row = roomRowMap[roomLabel];

    if (!row) {
      return;
    }

    const effectiveCheckIn = reservation.checkInDate < range.start ? range.start : reservation.checkInDate;
    const effectiveCheckOut = reservation.checkOutDate > range.end ? range.end : reservation.checkOutDate;
    const startColumn = 2 + getDayIndex(range.start, effectiveCheckIn);
    const spanDays = Math.max(1, getDayIndex(effectiveCheckIn, effectiveCheckOut));
    const endColumn = Math.min(startColumn + spanDays - 1, totalColumns);
    const width = Math.max(1, endColumn - startColumn + 1);
    const targetRange = sheet.getRange(row, startColumn, 1, width);

    if (width > 1) {
      targetRange.mergeAcross();
    }

    const richTextValue = buildReservationRichText(reservation);

    targetRange
      .setFontWeight('normal')
      .setFontSize(BASE_FONT_SIZE)
      .setRichTextValue(richTextValue)
      .setWrap(true)
      .setVerticalAlignment('top')
      .setHorizontalAlignment('left')
      .setBackground(getReservationColor(reservation.status))
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

function getRoomLabels(reservations) {
  const unique = {};

  reservations.forEach(function (reservation) {
    unique[formatRoomLabel(reservation)] = true;
  });

  return Object.keys(unique).sort(naturalSort);
}

function formatRoomLabel(reservation) {
  const roomType = reservation.roomType || 'Sin categoría';
  const roomNumber = reservation.roomNumber || 'Sin asignar';
  return roomType + ': ' + roomNumber;
}

function buildReservationCellText(reservation) {
  const lines = [
    'HUESPED: ' + (reservation.guestName || 'Sin nombre'),
    'N° PERSONAS: ' + (reservation.guestCount || 'Sin dato'),
    'FECHAS: ' + formatShortDate(reservation.checkInDate) + ' - ' + formatShortDate(reservation.checkOutDate),
    'PRECIO SIN IVA: ' + formatCurrency(reservation.roomPriceWithoutIva),
    'IVA: ' + formatCurrency(reservation.ivaAmount),
    'PRECIO CON IVA: ' + formatCurrency(reservation.roomPriceWithIva),
    'INCLUYE IVA: ' + (reservation.hasIva ? 'Sí' : 'No') + (reservation.hasIvaExtras ? ' (Extras: Sí)' : ''),
    'FORMA DE PAGO: ' + (reservation.paymentMethod || 'Sin especificar'),
    'RESERVA: ' + (reservation.source || 'Sin especificar'),
    'CELL: ' + (reservation.phoneNumber || 'Sin dato'),
    'EMAIL: ' + (reservation.email || 'Sin dato'),
  ];

  if (reservation.notes) {
    lines.push('NOTAS: ' + reservation.notes);
  }

  return lines.join('\n');
}

function buildReservationRichText(reservation) {
  const cellText = buildReservationCellText(reservation);
  const fontColor = getReservationFontColor(reservation.status);

  const baseStyle = SpreadsheetApp.newTextStyle()
    .setFontSize(BASE_FONT_SIZE)
    .setBold(false)
    .setForegroundColor(fontColor)
    .build();

  const notesStyle = SpreadsheetApp.newTextStyle()
    .setFontSize(NOTES_FONT_SIZE)
    .setBold(true)
    .setForegroundColor(fontColor)
    .build();

  const richTextBuilder = SpreadsheetApp.newRichTextValue()
    .setText(cellText)
    .setTextStyle(baseStyle);

  const notesPrefix = 'NOTAS:';
  const notesIndex = cellText.indexOf(notesPrefix);

  if (notesIndex !== -1) {
    richTextBuilder.setTextStyle(notesIndex, cellText.length, notesStyle);
  }

  return richTextBuilder.build();
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
  return day + '/' + month;
}

function formatShortDate(date) {
  return date.getDate() + ' ' + getMonthLabel(date.getMonth());
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

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return startOfDay(new Date(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  const str = String(value).trim();
  const date = new Date(str);
  if (!Number.isNaN(date.getTime())) {
    const match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      return startOfDay(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    }
    return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return startOfDay(new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1])));
  }

  return null;
}

function naturalSort(left, right) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

function removeAllMerges(sheet) {
  const merges = sheet.getDataRange().getMergedRanges();
  merges.forEach(function (range) {
    range.breakApart();
  });
}

function jsonResponse(payload, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({}, payload, { statusCode: statusCode })))
    .setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ATAMSA')
    .addItem('Archivar meses anteriores en hojas de respaldo', 'archivarMesesAnterioresManual')
    .addItem('Reconstruir vistas de calendario', 'rebuildCalendarViews')
    .addToUi();
}

function archivarMesesAnterioresManual() {
  const rawSheet = getReservationsSheet();
  pruneExpiredReservations(rawSheet);
  rebuildCalendarViews();
  SpreadsheetApp.getActiveSpreadsheet().toast('Historial reconstruido en hojas de calendario con éxito.', 'ATAMSA', 5);
}

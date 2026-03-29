# Google Sheets Webhook Setup

Este proyecto puede sincronizar reservas del calendario hacia Google Sheets usando un webhook de Google Apps Script.

## 1. Crear la hoja

1. Crea un Google Sheet nuevo.
2. Ponle un nombre reconocible, por ejemplo `Hotel Calendar Sync`.
3. Dentro del archivo, la pestaña se creará automáticamente con el nombre `Reservations`.

## 2. Crear el Apps Script

1. Abre el Google Sheet.
2. Entra a `Extensiones > Apps Script`.
3. Reemplaza el contenido del archivo principal con el script de:
   [scripts/google-sheets-webhook.gs](/Users/andersonuribe/Desktop/AppIA/scripts/google-sheets-webhook.gs)
4. Guarda el proyecto.

## 3. Publicar como Web App

1. Haz clic en `Deploy > New deployment`.
2. Selecciona `Web app`.
3. Configura:
   - Execute as: `Me`
   - Who has access: `Anyone with the link` o el alcance que prefieras
4. Despliega y copia la URL del Web App.

## 4. Configurar la app

En [`.env.local`](/Users/andersonuribe/Desktop/AppIA/.env.local) agrega:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

Luego reinicia el servidor.

## 5. Cómo funciona

La app envía payloads con estas acciones:

- `upsert`: crea o actualiza una reserva
- `bulk_upsert`: sincroniza varias reservas
- `delete`: preparado para eliminación futura

Las columnas escritas en la hoja son:

- `reservationId`
- `guestName`
- `phoneNumber`
- `email`
- `guestCount`
- `roomPrice`
- `travelerId`
- `roomId`
- `roomNumber`
- `hotel`
- `roomType`
- `checkIn`
- `checkOut`
- `status`
- `source`
- `notes`
- `sheetRowId`
- `createdAt`
- `updatedAt`

## 6. Flujo de uso

1. Entra a [calendar/page.tsx](/Users/andersonuribe/Desktop/AppIA/src/app/calendar/page.tsx)
2. Si hace falta, usa `Migrar viajeros`
3. Actualiza también el Apps Script con la versión nueva de [google-sheets-webhook.gs](/Users/andersonuribe/Desktop/AppIA/scripts/google-sheets-webhook.gs)
4. Vuelve a desplegar el Web App como nueva versión
5. Usa `Sincronizar Sheets`
6. Verifica que las filas aparezcan en la hoja con las nuevas columnas

## 7. Nota operativa

La sincronización actual es unidireccional:

- App -> MongoDB -> Google Sheets

Todavía no está implementada la edición desde Google Sheets hacia la app.

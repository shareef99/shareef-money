package expo.modules.smsreader

import android.provider.Telephony
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Reads the device SMS inbox via the Telephony content provider. Requires the
// READ_SMS runtime permission (requested from JS before calling). Messages are
// parsed and stored on-device only — nothing ever leaves the phone.
class SmsReaderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SmsReader")

    // Inbox messages newer than `sinceMs`, newest first, capped at `limit`.
    AsyncFunction("getMessages") { sinceMs: Double, limit: Int ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val projection = arrayOf(
        Telephony.Sms._ID,
        Telephony.Sms.ADDRESS,
        Telephony.Sms.BODY,
        Telephony.Sms.DATE,
      )
      val selection = "${Telephony.Sms.DATE} > ?"
      val selectionArgs = arrayOf(sinceMs.toLong().toString())
      val out = mutableListOf<Map<String, Any?>>()
      context.contentResolver
        .query(
          Telephony.Sms.Inbox.CONTENT_URI,
          projection,
          selection,
          selectionArgs,
          "${Telephony.Sms.DATE} DESC",
        )
        ?.use { cursor ->
          val iId = cursor.getColumnIndexOrThrow(Telephony.Sms._ID)
          val iAddress = cursor.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
          val iBody = cursor.getColumnIndexOrThrow(Telephony.Sms.BODY)
          val iDate = cursor.getColumnIndexOrThrow(Telephony.Sms.DATE)
          while (cursor.moveToNext() && out.size < limit) {
            out.add(
              mapOf(
                "id" to cursor.getLong(iId).toString(),
                "address" to (cursor.getString(iAddress) ?: ""),
                "body" to (cursor.getString(iBody) ?: ""),
                "date" to cursor.getLong(iDate).toDouble(),
              ),
            )
          }
        }
      return@AsyncFunction out
    }
  }
}

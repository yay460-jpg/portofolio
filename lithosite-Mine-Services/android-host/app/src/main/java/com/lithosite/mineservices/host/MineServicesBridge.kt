package com.lithosite.mineservices.host

import android.content.Context
import com.chaquo.python.Python

class MineServicesBridge(private val context: Context) {
    private val python = Python.getInstance()
    private val entry = python.getModule("android_entry")

    fun healthcheck(): String {
        return entry.callAttr("healthcheck", context.filesDir.absolutePath).toString()
    }

    fun call(requestJson: String): String {
        return entry.callAttr(
            "handle",
            context.filesDir.absolutePath,
            requestJson
        ).toString()
    }
}
